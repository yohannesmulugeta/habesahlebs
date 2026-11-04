# Habesha Lebs runway demo

A local, static lookbook concept with six AI-generated Ethiopian-inspired looks, twelve illustrative products, and sample ETB prices. The images and prices are fictional and the bag is a browser-only demonstration. Nothing is sold or saved to a server.

Run locally from this folder in PowerShell:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open <http://localhost:8000>. Drag or scroll over the runway, use the arrow keys while the runway has focus, or use the on-screen arrows. Product hearts and the demo bag work for this browser session.

No packages, database, credentials, or build step are required.

## Publish with GitHub Pages

In the [repository's Pages settings](https://github.com/yohannesmulugeta/habesahlebs/settings/pages), select **Deploy from a branch**, choose **main** and **/(root)**, then select **Save**. GitHub will publish the site at <https://yohannesmulugeta.github.io/habesahlebs/>. Later pushes to `main` update it automatically.
