import os

import json

import dataHandle 

from userHandle import userHandle
from userHandle import get_ip
import threading
from flask import Flask, url_for, request, render_template, redirect, send_from_directory, make_response

app = Flask("sleepingrepo")
#il browser manderà solo cookie su request in https se il cookie è marcato "SECURE"
app.config['SESSION_COOKIE_SECURE'] = True
#non permetto l'invio di cookies da altri siti
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

app.config['SESSION_COOKIE_HTTPONLY'] = True,

app.uh = userHandle("dati.json")
#qui va sostituito con i file di configurazione
app.url1 = 'http://'+get_ip()+":1025"
app.url2 = 'http://'+get_ip() + ":1026"
app.urlself = 'https://'+get_ip()
#app.urlself = 'https://sleepingrepo.ddns.net'
app.shared_lock = threading.Lock()

#flask ragiona a route
#di conseguenza scelgo i uri e poi decidere il metodo
@app.route("/", methods=['GET'])
def index():

	#instrado controllando i cookies
	try:
		#provo a vedere se aveva messo remember me

		token = request.cookies.get("token")
		uname = request.cookies.get("uname")

		ans = app.uh.remember(token,uname)

		if ans == True:
			s ="download"
		else:
			s = "login"
	except:
		s = "login"
	return redirect("https://" + get_ip() + "/" + s)


@app.route('/favicon.ico')
def favicon():

	return send_from_directory(os.path.join(app.root_path, 'static'),
							   'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route("/<uri>", methods=['GET'])
def GET(uri):
#metodo GET. Serie di if in base alla richiesta
#if uri mi serve per capire se ho degli uri e quindi se l'utente vuole una risorsa specifica altrimenti va a login

	if uri == "confirm":
		#caso particolare di un link che deve portare ad una pagina a vuoto
		user = app.uh.confirmU(params["epona"])
		s = "AboutUs.html"#pagina placeholder
	elif uri == "institute":
		with open ("institutes.json", "r") as f:
			inst = json.load(f)
		f.close()
		output = json.dumps(inst)
		s=False

	else:
		#passo come risposta uri che sarebbe la zona del sito dove vuole andare
		s = uri + ".html"

	if s!=False:
		#prendo la pagina e la espongo
		output = render_template(s)



	return output

@app.route("/", methods=['PATCH'])
def PUT(myFile = None):
	action = request.args.get('action', '')

	body = request.data
	resp={"data":""}
	dati = json.loads(body.decode('utf-8'))
	res = make_response()
	if action == "change":
		app.uh.changepsw(dati)
		s = "200"
	res.set_data( json.dumps(resp))
	res.status = str(s)

	#qui permetto solo ad alcune fonti di essere "autorizzate". Altri codici (css o js) da altre fonti non funzionano
	res.headers['Content-Security-Policy'] = "default-src 'self' https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css  unsafe-inline' 'unsafe-eval'; img-src 'self' data:; font-src 'self' https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.woff2 https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.ttf https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.woff"
	#ritorno il codice http
	return res


@app.route("/", methods=['POST'])
def POST(myFile = None):


	#passo l'azione come parametro, non come uri perché non è una risorsa ma un parametro, appunto
	action = request.args.get('action', '')

	res = make_response()
	#respo è il dizionario con il contenuto del response
	resp={"data":""}
	#controllo che non sia diverso perché ho bisogno di decodifiche diverse del body
	if action != "upload":

		body = request.data

		dati = json.loads(body.decode('utf-8'))

	if action == "login":
		ans, token = app.uh.login(dati)

		if ans == True:
			if token != "":
				#se devo ricordarmi allora setto i cookie per durare più di una sessione
				#tiene l'accesso per una settimana se non entro entro una settimana non si ricorda
				max_age = 3600 * 24 * 7 *30

			else:
				max_age = None

			#setto i cookie per la sessione corrente

			res.set_cookie("uname", value=dati['uname'], max_age = max_age, secure=True, samesite='Lax')

			#con httponly il token non può essere visto da javascript. Significa che se per caso qualcuno mette del software melevolo nel browser vede ruolo e username e se ha confermato la mail
			#per un attaccante è praticamente impossibile rubare le credenziali a meno che non riesce a prenderle dal browser...
			res.set_cookie("token", value=token, max_age = max_age, httponly=True,  secure=True, samesite='Lax')
			u = "reposleep" + dati["uname"]

			res.set_cookie("confirm", value=str(app.uh.reference[u]["confirm"]), max_age = max_age,  secure=True, samesite='Lax')
			res.set_cookie("role", value=app.uh.reference[u]["role"], max_age = max_age,  secure=True, samesite='Lax')
			res.set_cookie("name", value=app.uh.reference[u]["name"], max_age = max_age, httponly=True,  secure=True, samesite='Lax')

			s = "200" #tutto ok
		else:
			s = "401" #non autorizzato

	elif action == "subscribe":
		#elimino la conferma password non mi serve
		del dati["psw2"]
		#subscribe è una funzione con return booleano ha fatto o non ha fatto
		ans = app.uh.subscribe(dati, app.url2, app.urlself)
		s = "Login.html"
		if ans == True:
			s = "200"
		else:
			s = "500"

	elif action == "reset":
		#prendo l'email dell'utente in questione
		email = dati["email"]
		ans = app.uh.resetmail(email, app.urlself)
		if ans:
			s = "200"
		else:
			s = "401"

	elif action == "download":
		##da sistemare. Uso post perché mando dei dati e così non appaiono nel browser. Sempre meglio stare più sicuri
		##parte di creazione della parte di stringa dove i component
		try:
			inf=''
			ist=''
			filt=''
			signals = []
			with open('look_up_table.json', 'r') as f:
				table=json.load(f)
				f.close()
			for i in dati['Information']:
				tmp = table[i]
				tmp=tmp.replace(" ", "_")
				signals.append(tmp)
				inf=inf +"&component-code=" + tmp
			for i in dati['performer.issuer.display']:

				ist=ist +"&performer.issuer.display=" + i

			for key, value in dati.items():
				if "ALL_" not in value and key!="Information" and key != "performer.issuer.display":
					tmp = value.replace("=", "")
					tmp = tmp.replace("_", "")
					tmp=tmp.replace(" ", "_")
					filt=filt +"&"+key+"=" + tmp

			req=app.url1 + "/observation?code=28633-6" + filt + inf + ist



			result = dataHandle.get_from_mirth(req)

			if type(result)!=str:
				s = result.status_code

			else:
				s = result

			if str(s) == "200":


				resp["data"] = result.text

				#fallo a stringa
				resp["count"] = dataHandle.count_signals(json.loads(result.text), signals)
		except:
			s=500

	elif action == "upload":
		#chiedo i cookie, voglio lo username
		#cookies = cherrypy.request.cookie
		uname = name = request.cookies.get('uname')

		#faccio il nome che ho nel mio json
		who = 'reposleep' + uname 
		ist = app.uh.reference[who]['institute']


		#vedo quanti upload ha fatto l'utente oggi
		with app.shared_lock :
			n = app.uh.countActivity(ist)
			#creo la stringa che indetificherà i file da mandare
			ide = ist + str(n)
			#aumento il numero di upload per l'utente
			app.uh.increaseN(n, ist)

		#leggo il file

		file = request.data
		#prendo il nome del file

		filename = request.headers['x-filename']


		#istanzio un oggetto "dato"
		dato = dataHandle.data(filename, file, uname, ide, 'observation' )
		del file
		del filename


		#lo converto in fhir
		dato.to_fhir()
		#mando a mirth
		s = dato.send_to_mirth(app.url1)

	#resp["code"] = s

	res.set_data( json.dumps(resp))
	res.status = str(s)

	#qui permetto solo ad alcune fonti di essere "autorizzate". Altri codici (css o js) da altre fonti non funzionano
	res.headers['Content-Security-Policy'] = "default-src 'self' https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css  unsafe-inline' 'unsafe-eval'; img-src 'self' data:; font-src 'self' https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.woff2 https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.ttf https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.woff"
	#ritorno il codice http
	return res
#altra opzione di sicurezza che impedisce ad eventuali attaccanti di iniettare dei codici malevoli nel browser
@app.after_request
def apply_caching(response):
	response.headers["X-Frame-Options"] = "SAMEORIGIN"
	return response

@app.route('/terms/cookies')
def cookies():

	return render_template('cookies.html')


	


if __name__ == "__main__":

	#metto il certificato e le chiavi
	context = ('cert.pem', 'privkey.pem')
	app.run(ssl_context=context, host=get_ip(), port="443", debug=True)