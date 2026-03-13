#!/usr/bin/env python3
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
import os
from urllib.parse import urlparse, unquote
from datetime import datetime
import mimetypes

HOST = '127.0.0.1'
PORT = 3000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SUB_DIR = os.path.join(BASE_DIR, 'customerdetail')
SUB_FILE = os.path.join(SUB_DIR, 'submissions.txt')

class Handler(BaseHTTPRequestHandler):
    def _set_headers(self, code=200, content_type='application/json'):
        self.send_response(code)
        self.send_header('Content-Type', content_type)
        # allow CORS for convenience during testing from different origins
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path == '/ping':
            self._set_headers(200)
            self.wfile.write(json.dumps({'ok': True}).encode())
            return
        # serve static files from BASE_DIR
        if path == '/' or path == '/index.html':
            file_path = os.path.join(BASE_DIR, 'index.html')
        else:
            # strip leading slash
            file_path = os.path.join(BASE_DIR, path.lstrip('/'))
        if os.path.isfile(file_path):
            ctype, _ = mimetypes.guess_type(file_path)
            if not ctype:
                ctype = 'application/octet-stream'
            self._set_headers(200, content_type=ctype)
            with open(file_path, 'rb') as f:
                self.wfile.write(f.read())
            return
        # not found
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != '/api/contact':
            self.send_response(404)
            self.end_headers()
            return
        content_length = int(self.headers.get('Content-Length', 0))
        raw = self.rfile.read(content_length)
        try:
            data = json.loads(raw.decode('utf-8'))
        except Exception as e:
            self._set_headers(400)
            self.wfile.write(json.dumps({'error': 'Invalid JSON'}).encode())
            return
        name = data.get('name')
        email = data.get('email')
        message = data.get('message')
        company = data.get('company', '-')
        if not name or not email or not message:
            self._set_headers(400)
            self.wfile.write(json.dumps({'error': 'Missing required fields'}).encode())
            return
        # ensure directory
        try:
            os.makedirs(SUB_DIR, exist_ok=True)
            entry_lines = [
                '---',
                f"Time: {datetime.utcnow().isoformat()}Z",
                f"Name: {escape(name)}",
                f"Email: {escape(email)}",
                f"Company: {escape(company)}",
                'Message:',
                escape(message),
                ''
            ]
            with open(SUB_FILE, 'a', encoding='utf-8') as f:
                f.write('\n'.join(entry_lines) + '\n')
            self._set_headers(200)
            self.wfile.write(json.dumps({'ok': True, 'message': 'Submission saved', 'path': 'customerdetail/submissions.txt'}).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': 'Failed to save submission', 'details': str(e)}).encode())

def escape(s):
    if s is None: return ''
    return str(s).replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')

if __name__ == '__main__':
    server = HTTPServer((HOST, PORT), Handler)
    print(f'Temp server running on http://{HOST}:{PORT}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('Shutting down')
        server.server_close()
