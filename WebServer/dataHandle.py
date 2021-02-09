
import pandas as pd 
from io import StringIO

from datetime import datetime
import requests

import json

import chardet

import pyedflib

import os
import shutil

#classe che rappresenta il dato
class data(object):

	#costruttore della classe data. input: string name, bytes file, string performer, string ide, string resource, string format, string encode

	def __init__(self, name, file, performer, ide, resource):
		#parametri dell'oggetto

		supported_format=["csv", "edf", "asc", "json"]
		self.file = file
		name = name.split('.')
		self.format = name[-1]
		self.encode = "unknown"
		if self.format in supported_format and self.format !='edf' and self.format !='json':
			self.encode = self.__predict_encoding(1000)


		self.performer = performer
		self.id = ide
		self.resource = resource

		with open('code_supported.json', "r") as f:           # apro il file con i dati degli utenti e inserisco quello che ho in una variabile
			self.codes = json.load(f)['code']
		f.close()



	#funzione che inizia la conversione verso fhir. non ha né input né output agendo solo sui parametri interni alla classe
	def to_fhir(self):
		#sceglo il formato
		if self.format == 'asc':
			self.__from_asc()
		elif self.format == 'csv':
			self.__from_csv()
		elif self.format == "edf":
			self.__from_edf()
		elif self.format == "json":
			self.__from_json()

	#funzione che prova a capire che tipo di codifica ha il file. input: int lines. output: string guess
	#lines è il nomero di bytes che devo prendere. serve a velocizzare il tutto. Un numero troppo basso porta a errori (codifiche sbagliate con certezza del 100%)
	def __predict_encoding(self, lines):

		raw = self.file[0:lines]
		predict = chardet.detect(raw)
		#se la confidence è basse raddoppio il numero di bytes
		if predict['confidence'] >= 0.5:
			guess = predict['encoding']
		else:
			#funzione ricorsiva
			try:
				guess = self.__predict_encoding(lines * 2)
			except:
				#se ho la confidence bassa e ho finito il file prendo l'ultimo risultato ottenuto
				guess = predict['encoding']
		return guess


	#funzione per convertire dal csv. non ho né input né output agisce tutto internamente all'oggetto
	def __from_csv(self):
		#metodo privato
		#metto a stringa il file
		s = str(self.file,self.encode)
		#e poi lo preparo per essere letto con pandas
		data = StringIO(s)
		data = pd.read_csv(data)
		#pulizia della stringa dei dati dei sensori e delle unità di misura
		ch = data.columns.array
		ch = ch[2:11]
		canali = ch
		
		ch = str(list(ch))
		ch = ch[1:-1]
		ch = ch.replace("'", '')
		ch = ch.replace("]", "[")
		ch = ch.split("[")
		#faccio a meno uno perché l'ultimo elemento è vuoto
		ch = ch[0:-1]
		mis = ''
		cha = ''
		i = 0
		#ciclo per scindere le unità di misura dai canali
		while i < len(ch):
			mis = mis + ch[i + 1] +' '
			cha = cha + ch[i] + ' '
			i = i + 2
		stringa = ''
		#ciclo sulla stringa che comporrà i dati
		for i in canali:
			segnali = str(list(data[i]))
			segnali = segnali.replace("[", '')
			segnali = segnali.replace("]", '')
			stringa = stringa + segnali + ' \n'


		with open('observation_temp.json', 'r') as f:
			template = json.load(f)
			f.close()
		#ciclo lungo i component del template
		template['effectiveDateTime'] = datetime.today().strftime('%Y-%m-%d')
		template['performer'][0]['reference'] = self.performer
		template['identifier'][0] ['value'] = 'SleepData'+self.id
		for i in range (len(template['component'])):
			if template['component'][i]['code']['coding'][0]['code']=="733919004":
				template['component'][i]['code']['coding'][0]['display']=cha
				template['component'][i]['valueSampledData']['data']=stringa
				template['component'][i]['valueSampledData']['dimensions']=len(canali)
				template['component'][i]['valueSampledData']['origin']['unit']=mis
		self.file = template
		self.format = 'json'
	
	#funzione per convertire dal asc. non ho né input né output agisce tutto internamente all'oggetto
	def __from_asc(self):
		#metodo privato
		#decodifico il file
		file = self.file.decode(self.encode)
		#comincio a dividire in una lista. ogni riga è un elemento della lista
		lines = file.split('\n')
		lines1 = lines[0:10]
		lines2 = lines[11:len(lines)-1]
		file = []
		for i in lines1:
			file.append(i.split(' '))
		#prendo la sampling rate
		sr = file[5][len(file[5])-1]
		sr = int(sr)
		#prendo l'unità di misura
		mis = file[6][len(file[6])-1].replace('"', '')
		mis = mis.replace('[', '')
		mis = mis.replace(']', '')
		
		#prendo i nomi dei canali (?)
		n1 = str(lines1[8].split(','))
		n1 = n1.replace(',', '')
		n1 = n1.replace('[', '')
		n1 = n1.replace(']', '')
		n1 = n1.replace("'", '')
		n1 = n1.replace('"', '')
		n2 = file[9]
		data = []
		for i in lines2:
	
			#prendo gli spazi e ci metto un _ ne ho messi relativamente pochi perché così copro i casi con tante cifre
			var = i.replace('  ', '_')
			var = var.replace(' ', '')
			var = var.replace('__', '_')
			#do lo stesso comando due volte così elimino la possibilità dei ___
			var = var.replace('__', '_')
			var = var.split('_')
			data.append(var)
		#qua faccio la trasposta passando per un oggetto di tipo map
		da = list( map(list, zip(*data)))
		stringa = ''
		for i in da:
		#pulisco la lista/stringa
	
			st = str(i)
			st = st.replace(',', '')
			st = st.replace('[', '')
			st = st.replace(']', '')
			st = st.replace("'", '')
			st = st.replace("'", '')
		#ho bisogno degli spazi tra i campioni quindi non posso eliminare ogni spazio ma se ci fossero degli spazi troppo grandi (per esempio davanti al primo campione)
		#in questo modo a coppie di due elimino gli spazi. Mal che vada ho un solo spazio davanti
			st = st.replace("  ", '')
		#così controllo che se ho una riga di spazi dopo averli eliminati non metto il \n. Ho messo and !=' ' perché se gli spazi sono dispari ne ho uno
			if st != '' and st != ' ':
				st = st+'\n'
			stringa = stringa + st

		with open('observation_temp.json', 'r') as f:
			template = json.load(f)
			f.close()
		#ciclo lungo i component del template
		template['effectiveDateTime'] = datetime.today().strftime('%Y-%m-%d')
		template['performer'][0]['reference'] = self.performer
		template['identifier'][0] ['value'] = 'SleepData'+self.id
		for i in range (len(template['component'])):
			if template['component'][i]['code']['coding'][0]['code'] == '18648009':
				template['component'][i]['code']['coding'][0]['display'] = n1
				template['component'][i]['valueSampledData']['data'] = stringa
				template['component'][i]['valueSampledData']['dimensions'] = 8
				template['component'][i]['valueSampledData']['origin']['unit'] = mis
		self.file = template
		self.format = 'json'

#funzione per la conversione da edf. L'idea di base è quella che prendo il file edf e lo divido in più fhir che mando con più requests. Devo fare così perché a livello computazionale è pesante tenere tutto in ram	
	def __from_edf(self):

		#s = str(self.file,self.enconde)
		#e poi lo preparo per essere letto con pandas
		#data = StringIO(s)
		#apro il file edf di appoggio che ho creato
		with open("tmp.edf", "wb") as f:
			f.write(self.file)
			f.close
		del f
		del self.file
		raw = pyedflib.EdfReader("tmp.edf")

		#liste con i nomi dei canali che possono capitare in un edf
		eeg_name=['Fp2-F4', 'F4-C4', 'C4-P4', 'P4-O2', 'C4-A1']
		eog_name=['ROC-LOC']
		emg_name=['EMG1-EMG2']
		ecg_name=['ECG1-ECG2']
		imp_name=['ADDDOME', 'ADDOME']



		with open('observation_temp.json', 'r') as f:
			template = json.load(f)
			f.close()
		#compilo i campi del json
		template['effectiveDateTime'] = datetime.today().strftime('%Y-%m-%d')
		template['performer'][0]['reference'] = self.performer
		template['identifier'][0] ['value'] = 'SleepData'+self.id


		os.mkdir(path)
		#in questo ciclo si va a cercare il segnale. Poi si controlla che già non eista già un altro segnale per questa risorsa: se c'è si aggiunge un nuovo canale altrimenti si crea un file nuovo
		for i in range(len(raw.getSignalLabels())):

			#variabile per capire se non ho trovato il segnale
			notfound=True
			

			if raw.getLabel(i) in eeg_name:
				fname='SleepData'+self.id+'eeg.json'
			elif raw.getLabel(i)  in eog_name:
				fname='SleepData'+self.id+'eog.json'

			elif raw.getLabel(i)  in ecg_name:
				fname='SleepData'+self.id+'ecg.json'

			elif raw.getLabel(i) in emg_name:
				fname='SleepData'+self.id+'emg.json'
	
			elif raw.getLabel(i) in imp_name:
				fname='SleepData'+self.id+'imp.json'
			#metti un else per bypassare tutto easy
			else:
				notfound=False
			
			if notfound==True:


				try:
					with open(self.id + "/" + fname, 'r') as f:
						js = json.load(f)
				except:
					js = template
					#prendo -8 perché voglio solo gli ultimi 8 caratteri del nome

					with open("component/"+fname[-8:], 'r') as f:
						js ['component'] = [json.load(f)]
						f.close()
					#metto questa operazione qua perché non ha senso farla sempre
					js['identifier'][0]['value'] = self.id
				js['component'][0]['code']['coding'][0]['display'] = js['component'][0]['code']['coding'][0]['display'] + raw.getLabel(i) + " "
				js['component'][0]['valueSampledData']['data'] = js['component'][0]['valueSampledData']['data'] + str(raw.readSignal(i).tolist())

				
				with open(self.id + "/" + fname, 'w') as f:
					json.dump(js, f)
					f.close()
				del js
				del fname
	

		self.format = "path"

		self.file = self.id

		del f

#funzione per la validazione dei json. Non ha né input né output
	def __from_json(self):
		#banalmente carico il file
		s = json.loads(self.file)
		#devo fare così perché se è un json totalmente a caso mi torna errore il codice
		try:
			#check se è una observation supportata e se ha delle component non vuote (se sono tutte nulle lo vedo su mirth)
			if s['code']['coding'][0]['code'] in self.codes and len(s['component'])!=0 and s["resourceType"]=="Observation":
				#solito gioco che metto la data e l'id personalizzato 
				s['effectiveDateTime'] = datetime.today().strftime('%Y-%m-%d')
				s['performer'][0]['reference'] = self.performer
				s['identifier'][0] ['value'] = 'SleepData'+self.id
				self.file = s
		#se non va metto il formato "null" così esce l'errore del formato sbagliato
			else:
				self.format = None
		except:
			self.format = None



#funzione per mandare i dati al database. input: string url. output string result

	def send_to_mirth(self, url):
		#mando a mirth riutilizzabile per mandare i dati delle persone
		if self.format == 'json':
			uri = url + '/' + self.resource
			try: 
				with open("prova.json", "w") as f:
					json.dump(self.file, f)

				print("sending to " + uri)
				result = requests.post(uri, json.dumps(self.file))
				#pulisco l'output della requests

				result=str(result)
				print(result)
				result = result.split(' ')

				result = result[1].replace('>', '')

				result = result.replace('[', '')

				result = result.replace(']', '')

			except:
				result = "500"
		elif self.format == "path":
			uri = url + '/' + self.resource
			for filename in os.listdir(self.file):

				with open(self.file+"/"+filename, "r") as f:
					tmp_file = json.load(f)

					try:
						print("sending to " + uri)
						result = requests.post(uri, json.dumps(tmp_file))
						#pulisco l'output della requests

						result=str(result)
						result = result.split(' ')

						result = result[1].replace('>', '')

						result = result.replace('[', '')

						result = result.replace(']', '')

					except:
						result = "500"
						break
			shutil.rmtree(self.file)
		else:
			result = "415" ##Unsupported Media Type

		return result
#funzione diversa dalla classe sopra,sta sola perché non è intesa nell'oggetto. Serve e richiedere i dati. Input: string url

def get_from_mirth(url):
	try:
		r=requests.get(url)

		dic = json.loads(r.text)

	except:
		r = "500"
	return r

#funzione per contare i segnali che ho preso quando richiedo dei dati dal database. Input: dic bundle, list signal. Output dic dic
#questa funzione non fa parte dell'oggetto
def count_signals(bundle, signal):
	#traduco signal
	with open("look_up_table.json", 'r') as f:
		table = json.load(f)
	#genero una lista a partire dai codici
	#in pratica prendo i values della look up table di cui ho la chiave
	nomi = list(table[_] for _ in signal)
	#inizializzo il dizionario
	dic = dict(zip(nomi, [0]*len(nomi))) 
	#ciclo sulle entry
	for i in bundle['entry']:
		#ciclo sui segnali
		for j in i["resource"]["component"]:
			if j['code']['coding'][0]['code'] in signal:
				#uso la look up table per convertire il codice nel nome comune
				dic[table[j['code']['coding'][0]['code']]] = dic[table[j['code']['coding'][0]['code']]] + 1
	#converto il dizionario in stringa e lo sistemo
	dic = str(dic)
	dic = dic.replace("{", "")
	dic = dic.replace("}", "")
	dic = dic.replace("'", "")
	dic = dic.replace("_", " ")
	dic = dic.replace('"', "")
	dic = dic.replace(',', ", ")
	dic = dic.lower()

	return dic