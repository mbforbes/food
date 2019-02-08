# python2.7 LOL sorry not sorry
# python -m server 8001

import BaseHTTPServer as bhs
import code
import sys
import SimpleHTTPServer as shs

import gnureadline


class SputHTTPRequestHandler(shs.SimpleHTTPRequestHandler):
    """What could go wrong."""
    def do_PUT(self):
        print self.headers
        length = int(self.headers["Content-Length"])
        path = self.translate_path(self.path)
        with open(path, "wb") as dst:
            dst.write(self.rfile.read(length))
        self.send_response(200)


if __name__ == '__main__':
    # serve on 127.0.0.1 so other computers can't connect probably I hope
    port = int(sys.argv[1])
    addr = '127.0.0.1'
    print 'Serving HTTP on %s:%s' % (addr, port)
    bhs.HTTPServer((addr, port), SputHTTPRequestHandler).serve_forever()
