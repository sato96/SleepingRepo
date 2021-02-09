var dbConn;
logger.info("Ok provo a connettermi al db!")
try {
	//qui inizio a prendermi delle informazioni importanti per il return
	var type = $('fhirType').toLowerCase();
	logger.info(type);
	var id = UUIDGenerator.getUUID();
	var versionId = 1;
	
	var data = AttachmentUtil.reAttachMessage(connectorMessage);
	var resource = FhirUtil.fromJSON(data, 'STU3');
	var resourceType = resource.getResourceType();
	var contentType = FhirUtil.getMIMETypeJSON();
	//controllo sul tipo, non deve essere nullo, ma nemmeno diverso da quello della request
	if (resourceType == null){

		return FhirUtil.createOperationOutcome('error', 'invalid', 'Resource type unknown cannot be created as a(n) ' + $('fhirType') + 'resource.', 'STU3');
	} else if (resourceType.toString().toLowerCase() != type){

		return FhirUtil.createOperationOutcome('error', 'invalid', 'Resource type '+ resourceType +' cannot be created as a(n) ' + $('fhirType') + 'resource.', 'STU3');
	}
	//aggiorno il last update
	var lastUpdated = updateResourceMeta(resource, id, versionId);
	//definisco una variabile di response
	var response;
	//per semplicità accedo come json normale è più facile
	var res = JSON.parse(data);
	var signals = res['component'];
	//segno null tutti i segnali così se non li trovo so già che sono null
	var gyro = null;
	var eeg = null;
	var ecg = null;
	var eeg = null;
	var eog = null;
	var emg = null;
	var imp = null;
	var spo2 = null;
	var fl = null;
	var fr = null;
	//creo la parte del nome comune
	p = '/home/sam/resources/'+res['identifier'][0]['value'] + res['effectiveDateTime'];
	for (i = 0; i < signals.length; i++){
		if (signals[i] != null){
			//not null è una variabile che mi serve per stabilire se non c'è manco un segnale di quelli che salvo
			var notnull = true;
			//mi aspetto un path, dato che il preprocess ha già tolto la parte con il segnale
			var list = signals[i].split('/');
			var fname = list[list.length-1];
			fname = fname.split('.');
			fname = fname[0].split('_');		
			var code = fname[1];
			logger.info(code)
			//apro la look_up_table
			var look_up_table = JSON.parse(FileUtil.read("/home/sam/look_up_table.json"));
			//qui lo uso solo per salvare le variabili per farci la stringa
			if (code == look_up_table['G']){
				gyro = signals[i];		
			}
			else if (code == look_up_table['Ecg']){
				ecg = signals[i];		
			}
			else if (code == look_up_table['Eeg']){
				eeg = signals[i];		
			}
			else if (code == look_up_table['Eog']){
				eog = signals[i];		
			}
			else if (code == look_up_table['Emg']){
				emg = signals[i];		
			}
			else if (code == look_up_table['Impedence']){
				imp = signals[i];		
			}
			else if (code == look_up_table['FootLeft']){
				fl = signals[i];		
			}
			else if (code == look_up_table["nasalflow"]){
				fr = signals[i];		
			}
			else if (code == look_up_table["SpO2"]){
				spo2 = signals[i];
			}	
		}
	}
	//elimino un po' di variabili. Risparmiare un minimo di ram non fa mai male
	delete look_up_table;
	delete signals;
	
	//connessione al db
	dbConn = DatabaseConnectionFactory.createDatabaseConnection('com.mysql.cj.jdbc.Driver','jdbc:mysql://localhost:3306/SleepingRepo','Admin','TesiAstel2020!');
	logger.info("still trying...")
} catch(err){
	return createOperationOutcome('error', 'transient', 'Error creating resource.', 500);
}finally {
	if (dbConn) { 
		//check che ho dei segnali
		if (notnull == true){
			//piccola query alla tabella dei ricercatori
			// è inutile ora perché il server che solitamente si interfaccia corregge e protegge mirth
			//ma se si volesse rendere mirth come una api pubblica e/o si vuole tagliare fuori il portale così ho risolto un problema
			//il problema consiste nel fatto che essende UserID una foreign key che rimanda alla tabella Ricercatore
			//da qui non ho modo di controllare che il ricercatore si sia iscritto, perché non c'è il portale con il suo login
			//quindi lascio nella tabella ricercatore (a cui nessuno ha accesso) un record che ha dei veri null in ogni campo
			//e la stringa "null" come ID, dato che, essendo ID una primary key, non posso tenerla null. Ma mi serve un placeholder,
			//un po' come milite ignoto, per così dire. Se il db non consoce chi ha caricato la roba posso comunque "fidarmi"
			//se è formattata bene, ma non posso assegnarla a nessuno
			//sostanzialmente è una cosa in più che non è indispensabile
			sql = 'select count(ID) from Ricercatore where ID="'+res['performer'][0]['reference'] +'";';
			logger.info(sql)
			var result = dbConn.executeCachedQuery(sql);
			result.next();
			if (result.getInt("count(ID)") == 0)
			{
				res['performer'][0]['reference'] = "null";
			}
			
			logger.info("connesso al db!");
			try{
				//provo l'inserimento nel db
				sql = 'INSERT INTO Misurazione (Id, Data, EOG, EKG, EEG, EMG, Impedence, SpO2, Feet, Nasal_Flow, Centre_Of_Gravity, UserID) VALUES ("'+res['identifier'][0]['value']+'", "'+res['effectiveDateTime']+'", "'+ eog+'", "'+ecg+'", "'+eeg+'", "'+emg+'", "'+imp+'", "'+spo2+'", "'+fl+'", "'+fr+'", "'+gyro+'", "'+res['performer'][0]['reference']+'");';
				logger.info(sql)
				var result = dbConn.executeUpdate(sql);

				//Creo un oggetto di classe FhirResponse
				response = FhirResponseFactory.getCreateResponse(data, id, String(versionId),lastUpdated , 200, contentType);
				//lo metto nella mappa
				responseMap.put('response', response);
				logger.info(response);
				logger.info(response.getMessage());

				return response.getMessage();
				
				}
			catch(err){
				logger.info("error")
				return createOperationOutcome('error', 'transient', 'Error creating resource.', 500);

			}
			
		}else{
			return FhirUtil.createOperationOutcome('error', 'invalid', "Resource can't have all components null", 'R4');
		}
/*
		logger.info(data)
		logger.info(id)
		logger.info(typeof(lastUpdated))
		logger.info(lastUpdated)

		response=FhirResponseFactory.getCreateResponse(data, id, String(versionId),lastUpdated , 200, contentType);

		responseMap.put('response', response);
		logger.info(response);
		logger.info(response.getMessage());

		return response;*/

	}else{
		return createOperationOutcome('error', 'transient', 'Error connecting to database.', 500);
	}
	
}
