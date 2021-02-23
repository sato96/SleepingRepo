from cheroot.wsgi import Server as WSGIServer
from cheroot.wsgi import PathInfoDispatcher as WSGIPathInfoDispatcher
from cheroot.ssl.builtin import BuiltinSSLAdapter

from webpage import app
from net import get_ip

#script per il settaggio del wsgi

my_app = WSGIPathInfoDispatcher({'/': app})
server = WSGIServer((get_ip(), 443), my_app)

ssl_cert = "cert.pem"
ssl_key = "privkey.pem"
server.ssl_adapter =  BuiltinSSLAdapter(ssl_cert, ssl_key, None)

if __name__ == '__main__':
   try:
      server.start()
   except KeyboardInterrupt:
      server.stop()