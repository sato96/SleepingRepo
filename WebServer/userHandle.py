
import smtplib, ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json
import random
import string
import socket
from datetime import datetime
import requests


#classe che gestisce gli utenti
class userHandle(object):

	##costruttore dell'oggetto: input: string list_users
	def __init__(self, list_users):

		#tiro fuori la lista degli utenti
		self.list_users = list_users
		with open(self.list_users, "r") as f:           # apro il file con i dati degli utenti e inserisco quello che ho in una variabile
			self.reference = json.load(f)
		f.close()
		try:
			with open('active.json', "r") as f:           # apro il file con i dati degli utenti e inserisco quello che ho in una variabile
				self.active = json.load(f)
			f.close()
		except:
			with open('active.json', "w") as f:           #se non c'è il file lo creo
				self.active = {"today": datetime.today().strftime('%Y-%m-%d'), "users":{}}
				json.dump(self.active,f)
			f.close()


		

	##funzione per il login. input: dic dati. output: bool ans, string token
	def login(self, dati):
	#controllo dei login. la logica è che do per scontato che l'utente non ci sia (ans=False)
		ans = False
		#qua controllo se esiste e scorro nella variabile. Se esiste metto ans true. 
		for key, value in self.reference.items():

			if value["uname"] == dati["uname"] and value["psw"] == dati["psw"]:
				ans = True
				break
		#salvo la nuova decisione di essere ricordati o meno
		
		if dati["rememberMe"] == True:
			#se l'utente vuole essere ricordato uso una stringa alfanumerica e poi la mando come cookie
			token = self.__get_random_alphanumeric_string(10)
		else:
			token = ""
		self.reference[key]["token"] = token
		with open(self.list_users, "w") as f:
			json.dump(self.reference, f)
		return ans, token

	#funzione per il controllo se l'utente ha fatto remember me. input: string token, string uname. output: bool ans
	def remember(self,token, uname):
		ans = False

		#qua controllo se esiste e scorro nella variabile. Se esiste metto ans true. 
		for key, value in self.reference.items():

			if value["uname"] == uname and value["token"] == token:

				ans = True
				break
		return ans

	#funzione per l'iscrizione dell'utente. input: dic dati, string url, string urlself. output: bool ans
	def subscribe(self, dati, url, urlself):
		ans = True
		#qua la logica è al contrario. 
		#Do per scontato che posso iscrivermi
		#questo campo vuoto con valore SignUp è inutile
		del dati[""]
		#qua vedo se è il primo utente. Caso particolare ma utile quando faccio le prove dato che devo usare mail vere
		if self.reference == {}:
			pass
			
		else:

			#controllo l'esistenza di tale utente e se lo trovo torno false
			for key, value in self.reference.items():

				if value["uname"] == dati["uname"] or value["email"] == dati["email"]:

					ans = False
					break
		if ans == True:
			#se l'utente non c'è creo il nome interno al mio json con cui identifico l'utente 
			u = "reposleep" + dati["uname"]
			#aggiungo il parametro di conferma: così posso fare login ma non posso caricare né scaricare i dati
			dati["confirm"] = False
			#questione if: siccome ho solo il ricercatore e poi dovrò pensare a cosa fare degli altri ruoli se verranno aggiunti io metto questo if
			#dove mando al db e aggiorno gli enti che pubblicano i dati
			#nell'else do per scontato che il db sia caricato ma è ovvio che sarà da metterci degli elif in futuro
			if dati["role"] == "researcher":
				with open ("institutes.json", "r") as f:
					institutes = json.load(f)
				f.close()

				inst = institutes["institutes"]
				if dati["institute"] in inst:
					pass
				else:
					inst.append(dati["institute"])
					institutes["institutes"] = inst
					with open("institutes.json", "w") as f:
						json.dump(institutes, f)
					f.close()

				#provo a mandare il dato al db, se non riesco devo dare tutto esito negativo
				db = self.__sendToDb(dati, url)
				#db = True

			else:
				db == True
			if db == True:
				#poi metto tutto il blocco nella variabile e nel file
				self.reference[u] = dati
				#inizio la procedura di autenticazione
				self.__send_auth(u, urlself)
				with open(self.list_users, "w") as f:
						json.dump(self.reference, f)
				f.close()
			else:
				ans = False

		return ans

	#funzione per mandare i dati al database. input: dic dati, string url. output bool
	def __sendToDb(self, dati, url):
		# per questioni di mantenibilità metto comunque un check se è ricercatore
		result = ""
		if dati["role"] == "researcher":
			with open ("practitioner_temp.json", "r") as f:

				temp = json.load(f)
			f.close()
			#compilo il template di fhir
			#questo se ci sono più ruoli lo sposto fuori dall'if 
			temp["identifier"][0]["value"] = dati["uname"]
			temp["name"]["given"] = dati["name"]
			temp["name"]["family"] = dati["surname"]
			temp["telecom"]["value"] = dati["email"]
			temp["qualification"][0]["issuer"]["display"] = dati["institute"]

			#faccio un try except per intercettare eventuali errori
			try:
				uri = url + '/' + 'practitioner'
				print("sending to " + uri)
				result = requests.post(uri, json.dumps(temp))
				print(result)
				result = str(result)

				result = result.split(' ')

				result = result[1].replace('>', '')

				result = result.replace('[', '')

				result = result.replace(']', '')
			except:

				result = "500"
		if result == "200":
			return True
		else:
			return False	





	#funzione che cambia la password. input: dic dati
	def changepsw(self, dati):
		for key, value in self.reference.items():
				if value["uname"] == dati["uname"] and value["psw"] == dati["temp"]:
					self.reference[key]["psw"] = dati["psw"]
					break
		with open(self.list_users, "w") as f:
			json.dump(self.reference, f)

	#funzione che tira fuori una stringa alfanumerica casuale. input: int length. output: string result_str
	def __get_random_alphanumeric_string(self, length):
		letters_and_digits = string.ascii_letters + string.digits
		result_str = ''.join((random.choice(letters_and_digits) for i in range(length)))
		return result_str


	# #funzione per caricare le pagine web. input string nome_t. output: jinja2.environment.Template template
	# def get_template(self, nome_t):
	# 	# leggo il contenuto del file
	# 	# lo faccio diventare un template tramite la funzione della libreria jinja2
	# 	with open(nome_t, "r") as f:
	# 		content = f.read()
	# 	template = Template(content)                            
	# 	return template


	#funzione per mandare l'email. input: string user, string url
	def __send_auth(self, user, url):
		##cripta e manda l'email
		email = self.reference[user]["email"]
		#qui devo fare il messaggio con html per il link
		message = MIMEMultipart("alternative")
		message["Subject"] = "[Sleeping Repository] Confirm your new account"

		html = '<a href="' + url + '/confirm?epona=' + str(user) + '">Click here to confirm</a>' 

		part2 = MIMEText(html, "html")
		message.attach(part2)
		self.__mailSender(email, message)

	#funzione per segnare l'avvenuta conferma. input: string user. output bool
	def confirmU(self, user):
		#decripta il dato
		#pongo confirm=True perché ho confermato l'identità
		self.reference[user]["confirm"] = True
		with open(self.list_users, "w") as f:
			json.dump(self.reference, f)
		return True

	#funzione che genera una password randomica da mettere come temporanea se si è scordato la propria
	#input: string email, string url. output bool
	def resetmail(self, email, url):

		message = MIMEMultipart("alternative")
		message["Subject"] = "[Sleeping Repository] Reset your password"
		temp_psw = self.__get_random_alphanumeric_string(8)
		print(temp_psw)
		try:
			for key, value in self.reference.items():
				print(str(key) + " "+ str(value))
				if value["email"] == email:
					self.reference[key]["psw"] = temp_psw
					break
			with open(self.list_users, "w") as f:
				json.dump(self.reference, f)

			html = '<p>Here is your password ' + str(temp_psw) + '. If you want to personalize it here is your link:<br><a href="' + url + '/changepsw">Click here to change it</a></p>'

			part2 = MIMEText(html, "html")

			message.attach(part2)
			print(part2)
			self.__mailSender(email, message)
			return True
		except:
			return False

	#funzione per mandare le email. input: string email, string message. output bool status

	def __mailSender(self,email, message):
		#preparo per comunicare con il server di gmail
		smtp_server = "smtp.gmail.com"
		port = 465  # For SSL
		sender_email = "sleepingrepo@gmail.com"
		password = "Astel2020!"
		receiver_email = email

		message["From"] = sender_email
		message["To"] = receiver_email
		print("Mi preparo a ssl")
		# creo un contesto ssl sicuro
		context = ssl.create_default_context()
		print(context)
		with smtplib.SMTP_SSL(smtp_server, port, context = context) as server:
			server.login(sender_email, password)
			print("login")
		# Provo a fare login nel server mail di gmail e inviare la mail
			try:
				#andrebbe messo misto testo e html
				

				server.sendmail(sender_email, receiver_email, message.as_string())
				#pongo la variabile status come vera perché sono nel try
				status = True

			except Exception as e:
				# Gestisco gli errori
				print(e)
				status = False
		return status

	#funzione che conta le attività giornaliere per singola istituzione in modo da creare degli id che, combinati con la data creino una chiave nel database
	#la variabile uname è un reflusso di quando la funzione era pensata per contare le attività dei sigoli utenti ma così si sarebbero creati degli errori
	#in quanto l'id della misurazione è basato sull'ente che ha fatto quella misurazione, in modo da essere più indicativo
	#input: string uname. output: int n
	def countActivity(self, uname):


		n = 0
		if self.active['today'] == datetime.today().strftime('%Y-%m-%d'):
			try:
				n = self.active['users'][uname]

			except:
				self.active['users'][uname] = 0
		else:
			self.active['today'] = datetime.today().strftime('%Y-%m-%d')
			self.active['users'] = {uname:0}

		return n

	#funzione per aumentare il numero di caricamenti per ente. input: int n, string uname
	#come sopra uname è un reflusso. siccome funziona uguale ho lasciato questo nome anche se non molto indicativo
	def increaseN(self, n, uname):
		try:
			self.active['users'][uname] = n + 1
			with open('active.json', "w") as f:  # apro il file con i dati degli utenti e inserisco quello che ho in una variabile
				json.dump(self.active, f)
			f.close()
		except:
			pass


def get_ip():
	s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
	try:
		# doesn't even have to be reachable
		s.connect(('10.255.255.255', 1))
		IP = s.getsockname()[0]
	except:
		IP = '127.0.0.1'
	finally:
		s.close()
	return IP