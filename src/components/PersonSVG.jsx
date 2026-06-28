export default function PersonSVG({ color, size }) {
  return <svg aria-hidden="true" width={size} height={size*1.55} viewBox="0 0 16 25"><circle cx="8" cy="5.5" r="4.5" fill={color}/><ellipse cx="8" cy="19" rx="6.5" ry="7" fill={color}/></svg>;
}
