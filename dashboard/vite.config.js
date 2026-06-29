import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {fileURLToPath} from "node:url";
export default defineConfig({plugins:[react()],test:{environment:"jsdom",setupFiles:fileURLToPath(new URL("./src/test/setup.js",import.meta.url))}});
