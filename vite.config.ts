import fs from "fs"
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, Plugin } from "vite"

function updateEnvPlugin(): Plugin {
  return {
    name: "update-env-plugin",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/api/update-env" && req.method === "POST") {
          let body = ""
          req.on("data", (chunk) => {
            body += chunk.toString()
          })
          req.on("end", () => {
            try {
              const { username, password } = JSON.parse(body)
              const envPath = path.resolve(__dirname, ".env")
              let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : ""
              
              if (username) {
                if (envContent.match(/^VITE_ADMIN_USERNAME=/m)) {
                  envContent = envContent.replace(/^VITE_ADMIN_USERNAME=.*$/m, `VITE_ADMIN_USERNAME=${username}`)
                } else {
                  envContent += `\nVITE_ADMIN_USERNAME=${username}`
                }
              }
              
              if (password) {
                if (envContent.match(/^VITE_ADMIN_PASSWORD=/m)) {
                  envContent = envContent.replace(/^VITE_ADMIN_PASSWORD=.*$/m, `VITE_ADMIN_PASSWORD=${password}`)
                } else {
                  envContent += `\nVITE_ADMIN_PASSWORD=${password}`
                }
              }
              
              fs.writeFileSync(envPath, envContent.trim() + "\n")
              res.statusCode = 200
              res.setHeader("Content-Type", "application/json")
              res.end(JSON.stringify({ success: true }))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
        } else {
          next()
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), updateEnvPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
