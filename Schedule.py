"""Personal Advancement — run this file to start the web app."""

import http.server
import socketserver
import webbrowser
from pathlib import Path

PORT = 8765
WEB_DIR = Path(__file__).parent / "web"


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def end_headers(self):
        path = self.path.split("?", 1)[0].lower()
        if path.endswith((".js", ".css")):
            self.send_header("Cache-Control", "public, max-age=86400")
        elif path.endswith(".html"):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        if str(args[1]) != "200":
            super().log_message(fmt, *args)


class ThreadedHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True


def main():
    if not WEB_DIR.is_dir():
        raise SystemExit(f"Missing web folder: {WEB_DIR}")

    with ThreadedHTTPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"Running at {url}")
        print("Press Ctrl+C to stop.")
        webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
