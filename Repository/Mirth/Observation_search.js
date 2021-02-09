//Canale che supporta il metodo search. viene usato search anche nel caso particolare di read, perché appunto read è solo una specializzazione.
//quindi per semplicità si è lasciato così
//in alcuni casi si noteranno delle notazioni diverse dal puro javascript: ho usato anche metodi di java quando richiamando qualche 
//libreria ho incontrato degli oggetti di java

var dbConn;
logger.info("Ok provo a connettermi al db!")
try {
	//inizio a prendere informazioni dal messaggio fhir che ho ricevuto
	var type = $('fhirType').toLowerCase();
	var requestURL = $('url');
	logger.info(requestURL)
	if (!requestURL.endsWith('/')) {
		requestURL += '/';
	}
	var requestURL = new java.net.URI(requestURL);
	logger.info(requestURL)
	//comincio ad analizzare i params della request, poi creo la query in sql in modo automatico
	params = $('parameters');
	//metto come array le chiavi dei parametri, così posso ciclarci sopra e sapere cosa c'è
	var k = params.getKeys().toArray();
	logger.info(k)

	/*serie di cicli per creare la query. L'idea è creare tre stringhe, corrispondenti alle tre parti della query (select, from e where)
	per mettere gli operatori logici all'interno (e per sapere se mettere la parte del where o meno) queste stringhe inizialmente sono
	delle liste. Le liste poi vengono unite in una stringa con i connettori logici (in particolare la forma base è una serie di and
	con degli elementi in or dentro le parentesi (servono per quando si hanno più istituti nei parametri o quando si cercano solo alcuni segnali
	*/
	//parte select
	var whereList = [];
	var signals = params.getParameterList('component-code').toArray();
	logger.info(signals.length)
	//9 è il numero massimo di segnali che posso avere
	if (signals.length == 9)
	{
		logger.info("tutti i segnali");
		var select = "SELECT m.*";
	}
	else if (signals.length == 0)
	{
		logger.info("no signals")
		var noSign = true;

	}
	else
	{
		logger.info("devo comporre la query")
		//nel select devo prendere sempre anche altri attributi e vanno presi obbligatoriamente per fare un fhir
		var select = "SELECT m.Id, m.Data, m.UserID"
		//come chiave uso i codici loinc che qua sono place holder
		//crea un json con sta roba e aprilo!!
		var look_up_table = JSON.parse(FileUtil.read("/home/sam/look_up_table.json"));
		logger.info(JSON.stringify(look_up_table));
		//prendo i valori delle keys
		var keys = Object.keys(look_up_table);
		//anche se stiamo parlando della parte select metto già una parentesi nel where, dato che ora come ora sono certo
		var whereS = "(";
		//ciclo sui segnali 
		for (i = 0; i < signals.length; i++)
		{
			//l'espressione con l'if server per sapere se esiste. Da indexOf ho l'indice nell'array. Se non c'è ho -1.
			if (keys.indexOf(String(signals[i])) != -1)
			{
			//comincio a fare anche la stringa del where perché così ciclo una sola volta nei segnali
			//i segnali stanno nel where perché devo assicurarmi che almeno uno dei segnali selezionati sia non null
			//in upload ho messo null come stringa. è praticamente impossibile che qualcuno metta un attributo con un vero "null"
			//proprio perché ogni cosa nel db passa per mirth e a mirth in automatico faccio mettere "null" come stringa, per precauzione
				whereS = whereS +"m."+look_up_table[signals[i]]+ "!='null' OR ";
				select = select + ", m."+ look_up_table[signals[i]];
			//nota bene: cerco il not null solo sui segnali perché gli altri attributi sono chiavi (UserID è una foreign key le altro sono primary key
				
			}
		}
		/*una volta creata la stringa whereS devo metterla nella lista where. Per farlo devo togliere gli ultimi caratteri
		che sono: " OR ", ossia due spazi e or
		*/
		whereS = whereS.slice(0, -4);
		whereS = whereS + ")";
		whereList.push(whereS);
	}
	//mappo le chiavi come stringa
	k = k.map(String);

	//parte from
	var from = " from Misurazione m";
	//l'if mi serve per vedere se ho dei filtri sull'istituzione. Se sì ho bisogno di un join con la tabella Ricercatore
	if (k.indexOf(String("performer.issuer.display")) != -1)
	{
		//aggiorno il from
		var from = from + " JOIN Ricercatore r ON m.UserID=r.ID";
		//parte della lista di istituti di ricerca
		//l'idea è questa: il primo lo metto, perché almeno uno c'è sempre e lo metto sempre a lista
		var listist = params.getParameterList('performer.issuer.display').toArray();
		var whereIst = "(r.Istituzione='" + listist[0].replace("_", " ") + "'";
		//qua è un discorso analogo ai segnali
		for (i = 1; i < listist.length; i++)
		{
			//se sono più di uno aggiungo gli or e le parentesi
			var whereIst = whereIst + " OR r.Istituzione='" + listist[i].replace("_", " ") + "'";
		}
		whereIst = whereIst + ")";
		whereList.push(whereIst);
	}
	//sfilza di if dove valuto l'inserimento degli altri parametri
	if (k.indexOf("performer") != -1)
	{
		whereList.push("UserID='" + params.getParameter("performer").replace("_", " ") + "'");
	}
	if (k.indexOf("identifier") != -1)
	{
		whereList.push("Id='" + params.getParameter("identifier").replace("_", " ") + "'");
	}
	/*qui c'è un piccolo trucchetto poco legit seguendo lo standard
	lo standard non sembra prevedere < o > per le date, ma è una funzione utilissima, quindi se mi servono quei simboli li mando come stringa nella data
	qui non faccio altro che spacchettarli
	in linea teorica la conformance del middleware è preservata dato che aggiungo una funzione in più. Se uno rispetta lo standard
	non può fare danni, se si usa il mio portale però hai qualche funzione extra
	*/
	if (k.indexOf("date") != -1)
	{
		var data = params.getParameter("date");

		if (data.includes("<") || data.includes(">"))
		{
			whereList.push("Data" + data.substr(0,1) + "'" + data.substr(1) + "'" );
		}
		else{
			whereList.push("Data='" + data + "'");
		}

	}

	//parte where
	if (whereList.length > 0)
	{
		var where = " WHERE";
		where = where + " " + whereList[0];
		for (i = 1; i < whereList.length; i++)
		{
			where = where + " AND " + whereList[i];
		}
	}
	var query = select +  from + where + ";";
	//potrei avere problemi di mancanza di ram se devo prendere molti dati. Ottimizzo così
	delete from;
	delete select;
	delete where;
	delete whereList;
	delete listist;
	delete whereIst;
	delete k;
	delete look_up_table;
	delete whereS;
	delete signals;
	delete params;
	logger.info(query)
	//tentativo di connessione al db
	dbConn = DatabaseConnectionFactory.createDatabaseConnection('com.mysql.cj.jdbc.Driver','jdbc:mysql://localhost:3306/SleepingRepo','Admin','TesiAstel2020!');
	logger.info("still trying...")
} catch(err){
	//se ci fosse un qualsiasi errore lo tiro fuori da qua
	return createOperationOutcome('error', 'transient', 'Error', 500);
}finally {
	if (dbConn) { 
		if (noSign)
		{
			return FhirUtil.createOperationOutcome('error', 'invalid', 'You have no component selected ' + $('fhirType') + 'resource.', 'STU3');
		}
		else
		{
			var result = dbConn.executeCachedQuery(query);
			/*qua mi prendo i nomi delle colonne (ossia degli attributi che escono dall query) 
			Il giochino sotto è puro javascript: splitto in una lista con la sottostringa da eliminare e riunisco senza aggiungere nulla
			serve per eliminare una sottostringa nella stringa, che in java non è possibile fare direttamente
			*/
			var col = select.split("m.").join("");
			col = col.replace("SELECT ", "");
			//ecco qua me li metto ad array (javascript)
			col = col.split(", ");
		
			//idea: cicli for annidati. il primo è per scorrere sull'output (e questo per forza)
			//poi ho un problema: capire quali variabili mi servono. Ho varie opzioni. Una è fare un gioco analogo a quello dell'input
			//ciclo sul nome di ciò che ho me lo prendo. Mi prendo il valore come stringa e poi in base al nome della variabile lo metto nel giusto posto
			//poi aggiungo il json al template del bundle (sarebbe una lista). Per facilitare il lavoro rallento l'esecuzione e metto il segnale alla fine
			//quindi in post processing farò una cosa speculare al pre processing ma lavorando solo con il download
			//qui c'è moltissimo java perché uso una libreria specifica per fhir
			//creazione modello di bundla (la risorsa che raccoglie l'output dopo una request search)	
			var bundle = new Packages.org.hl7.fhir.dstu3.model.Bundle().setType(Packages.org.hl7.fhir.dstu3.model.Bundle.BundleType.SEARCHSET);
			logger.info("Ho fatto la query ora creo il bundle")
			//il ciclo while mi permette di selezionare le varie righe dell'output delle query. la funzione next sposta il puntatore alla riga dopo
			while (result.next()) {
				//istanzio l'oggetto osservazione da inserire nel bundle. Ovviamente ogni riga è una osservazione
				var tmp = new Packages.org.hl7.fhir.dstu3.model.Observation();
				//ciclo for per scorrere lungo le variabili e compilare il modello osservazione
				for (i = 0; i < col.length; i++)
					{
						var dato = result.getString(col[i]);
						//serie di if per capire quale attributo sto guardando
						//ho tre if e un else: i particolari sono ID (della misurazione)
						//Data (che è la data, in italiano)
						//UserID che è la reference al ricercatore
						//l'else sta per i segnali
						if (col[i] == "Id")
						{
							//creo un oggetto identifier
							tmp.addIdentifier(new Packages.org.hl7.fhir.dstu3.model.Identifier().setValue(dato));
							//nei nomi con gli spazi,come politecnico di torino devo mettere l'underscore o mi da errore
							var entryId = dato.replace(" ", "_");
						}
						//creo sempre un oggetto da inserire in tmp
						else if (col[i] == 'Data')
						{
							var p = new Packages.org.hl7.fhir.dstu3.model.DateTimeType(dato);
							tmp.setEffective(p);
							//tmp.setIssued(Date(dato));
							logger.info(tmp.effective)
						}
						else if (col[i] == "UserID")
						{
							tmp.addPerformer(new Packages.org.hl7.fhir.dstu3.model.Reference(dato));
						}
						else
						{
							//faccio questo pezzo solo sulle variabili che ho, altrimenti mi da errore
		
							if (dato != "null")
							{
								//qui carico il pezzo di json con il segnale che avevo salvato nel file system in upload
								var elemento = JSON.parse(FileUtil.read(dato));
		
								//faccio la parte del sample data
								//quantity è un oggetto che mette il valore base della misurazione e ò'unità di misura
								var quantity = new Packages.org.hl7.fhir.dstu3.model.SimpleQuantity();
								quantity.setValue(elemento['valueSampledData']['origin']['value']);
								quantity.setUnit(elemento['valueSampledData']['origin']['unit']);
								//qua creo il sampledata object
								var sample = new Packages.org.hl7.fhir.dstu3.model.SampledData();
								//setto le dimensioni del segnale (quanti canali ho in pratica)
								sample.setDimensions(elemento['valueSampledData']['dimensions']);
								//il periodo che intercorre tra una misurazione e l'altra
								//non può essere null quando istanzio l'oggetto quindi mi serve l'if
								logger.info(elemento['valueSampledData']['period'])
								if (elemento['valueSampledData']['period'] != null)
								{
									//sample.setPeriod(new Packages.org.hl7.fhir.dstu3.model.DecimalType(Math.trunc(elemento['valueSampledData']['period'])));
									sample.setPeriod(elemento['valueSampledData']['period']);
								}
								//il segnale vero e proprio
								sample.setData(elemento['valueSampledData']['data']);
								sample.setOrigin(quantity);
								//faccio il codable concept
								var code = new Packages.org.hl7.fhir.dstu3.model.CodeableConcept();
								code.setText(elemento['code']['coding'][1]['text']);
								var coding = org.hl7.fhir.dstu3.model.Coding();
								coding.setSystem(elemento['code']['coding'][0]['system']);
								coding.setCode(elemento['code']['coding'][0]['code']);
								coding.setDisplay(elemento['code']['coding'][0]['display']);
								code.addCoding(coding);
								//qua unisco le due parti nell'oggetto component, poi lo aggiungo all'oggetto observation
								var dat = new Packages.org.hl7.fhir.dstu3.model.Observation.ObservationComponentComponent();
								dat.setCode(code);
								dat.setValue(sample);
								tmp.addComponent(dat);
								delete code;
								delete coding;
								delete dat;
								delete sample;
							}
						}
						delete dato	
					}

				logger.info("Sono uscito dal for sui risultati della query");
				var entryType = "Observation";
		
				//setto delle variabili per il response
		
				var entryVersion = "STU3";
				var entryData = FhirUtil.toJSON(tmp);
				var entryContentType = FhirUtil.getMIMETypeJSON();
				var entryRequestMethod = "GET";
				var entryRequestURL = requestURL;
				var resourceType = FhirUtil.getResourceType(entryType);
				if (resourceType != null) {
					entryType = resourceType.getPath();
				}
				delete tmp;
				delete entryType;
		
				var request = new Packages.org.hl7.fhir.dstu3.model.Bundle.BundleEntryRequestComponent().setMethod(new Packages.org.hl7.fhir.dstu3.model.Bundle.HTTPVerbEnumFactory().fromCode(entryRequestMethod)).setUrl(entryRequestURL);
		
				var entry = bundle.addEntry().setRequest(request);
		
				var relativeUrl = type ? '' : (resourceType + '/');
				if ($('url').contains('_search') && $('method') == 'POST') {
					relativeUrl = '../' + relativeUrl;
				}
				entry.setFullUrl(requestURL.resolve(relativeUrl + entryId + '/_search/' + entryVersion).toString());
				entry.setResource(FhirUtil.fromJSON(entryData));
				logger.info("Preparo i dati");
			}
			logger.info("Bundle fatto")
		
			bundle.setTotal(bundle.getEntry().size());;
			//preparo il response e lo metto nella mappa
			var response = FhirResponseFactory.getSearchResponse(FhirUtil.toJSON(bundle), 200, FhirUtil.getMIMETypeJSON());
			responseMap.put('response', response);
			logger.info("Finito! Manca solo il return")
			return response.getMessage();
		}			
		
	}
}
