"""Classify cosmic-ray survivors (Block 1 Testing Session tooling; see cosmic-ray.toml).

Usage: python -I cr_triage.py SESSION.sqlite SRC_ROOT [--diffs] [--reset-other]
--reset-other deletes the recorded results of the non-annotation survivors, so
`cosmic-ray exec` re-runs exactly those (to check that new tests kill them).
A survivor whose mutated position lies inside a type annotation (a parameter's
annotation, a return annotation, or an AnnAssign annotation) is reported as
ANNOTATION: under `from __future__ import annotations` those are never evaluated.
Everything else is printed with its diff for hand triage.
"""
import ast, sqlite3, sys, pathlib
from collections import Counter, defaultdict

db_path, root = sys.argv[1], pathlib.Path(sys.argv[2])
show = "--diffs" in sys.argv
reset = "--reset-other" in sys.argv
db = sqlite3.connect(db_path)
rows = db.execute("""select s.job_id, s.module_path, s.operator_name, s.start_pos_row, s.start_pos_col,
                            s.end_pos_row, s.end_pos_col, s.definition_name, r.worker_outcome, r.test_outcome, r.diff
                     from mutation_specs s join work_results r using(job_id)""").fetchall()
total = db.execute("select count(*) from mutation_specs").fetchone()[0]

spans = defaultdict(list)          # module -> [(start,end)] of annotation nodes
futures = {}
for mod in {r[1] for r in rows}:
    src = (root / mod).read_text()
    tree = ast.parse(src)
    futures[mod] = any(isinstance(n, ast.ImportFrom) and n.module == "__future__" and
                       any(a.name == "annotations" for a in n.names) for n in tree.body)
    for n in ast.walk(tree):
        anns = []
        if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
            a = n.args
            anns += [x.annotation for x in a.posonlyargs + a.args + a.kwonlyargs if x.annotation]
            anns += [x.annotation for x in (a.vararg, a.kwarg) if x is not None and x.annotation]
            if n.returns: anns.append(n.returns)
        elif isinstance(n, ast.AnnAssign):
            anns.append(n.annotation)
        for x in anns:
            spans[mod].append(((x.lineno, x.col_offset), (x.end_lineno, x.end_col_offset)))

def in_annotation(mod, row, col):
    return any(s <= (row, col) < e for s, e in spans[mod])

outcomes = Counter((r[8], r[9]) for r in rows)
surv = [r for r in rows if r[9] == "SURVIVED"]
ann = [r for r in surv if futures[r[1]] and in_annotation(r[1], r[3], r[4])]
other = [r for r in surv if r not in ann]
killed = sum(1 for r in rows if r[9] == "KILLED")
print(f"jobs: {total}, completed: {len(rows)}, outcomes: {dict(outcomes)}")
print(f"killed {killed}, survived {len(surv)} (annotation {len(ann)}, other {len(other)})")
if rows:
    print(f"raw kill rate: {killed}/{len(rows)} = {100*killed/len(rows):.1f}%")
    denom = len(rows) - len(ann)
    print(f"kill rate excluding annotation mutants: {killed}/{denom} = {100*killed/denom:.1f}%")
print("\nannotation survivors by module/line:", dict(Counter(f"{r[1].split('/')[-1]}:L{r[3]}" for r in ann)))
print("\n=== other survivors ===")
for r in sorted(other, key=lambda r: (r[1], r[3], r[4], r[2])):
    print(f"{r[1].split('/')[-1]} L{r[3]}:{r[4]} {r[2]} [{r[7] or ''}] job={r[0][:8]}")
    if show:
        print("\n".join("    " + l for l in r[10].splitlines() if l.startswith(("+", "-")) and not l.startswith(("+++", "---"))))

if reset:
    ids = [r[0] for r in other]
    db.executemany("delete from work_results where job_id = ?", [(i,) for i in ids])
    db.commit()
    print(f"\nreset {len(ids)} results; `cosmic-ray exec` will re-run them")
