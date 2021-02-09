var dbConn;
logger.info("Ok provo a connettermi al db!")
try {
	//qui inizio a prendermi delle informazioni importanti per il return
	var type = $('fhirType').toLowerCase();
	logger.info(type);
	var id = UUIDGenerator.getUUID();
	var versionId = 1;
	logger.info("fino agli id")
	var data = AttachmentUtil.reAttachMessage(connectorMessage);
	var resource = FhirUtil.fromJSON(data, 'STU3');
	var resourceType = resource.getResourceType();
	var contentType = FhirUtil.getMIMETypeJSON();
	
	//controllo sul tipo, non deve essere nullo, ma nemmeno diverso da quello della request
	if (resourceType == null){

		return createOperationOutcome('error', 'invalid', 'Resource type unknown cannot be created as a(n) ' + $('fhirType') + 'resource.', 'STU3');
	} else if (resourceType.toString().toLowerCase() != type){

		return createOperationOutcome('error', 'invalid', 'Resource type ' + resourceType + ' cannot be created as a(n) ' + $('fhirType') + 'resource.', 'STU3');
	}
	//aggiorno il last update
	var lastUpdated = updateResourceMeta(resource, id, versionId);
	logger.info(lastUpdated)
	var response;
	//per semplicità accedo come json normale è più facile
	var res = JSON.parse(data);

	
	
	dbConn = DatabaseConnectionFactory.createDatabaseConnection('com.mysql.cj.jdbc.Driver','jdbc:mysql://localhost:3306/SleepingRepo','Admin','TesiAstel2020!');
	logger.info(dbConn);
} catch(err){
	//questo manco servirebbe sta lì per emergenza
	return createOperationOutcome('error', 'transient', 'Internal error.', 500, 'R4');
}finally {
	if (dbConn) { 
		try{
			sql = 'INSERT INTO Ricercatore(ID, Nome, Cognome, Istituzione, Email) VALUES("' + res['identifier'][0]['value'] + '", "' + res['name']['given'] + '", "' + res['name']['family'] + '", "' + res['qualification'][0]['issuer']['display'] + '", "' + res['telecom']['value'] + '");';
			logger.info(sql)
			var result = dbConn.executeUpdate(sql);
			logger.info(result)
			dbConn.close();
			//Creo un oggetto di classe FhirResponse
			response = FhirResponseFactory.getCreateResponse(data, id, String(versionId),lastUpdated , 200, contentType);
			//lo metto nella mappa
			responseMap.put('response', response);
			logger.info(response);
			logger.info(response.getMessage());
	
			return response.getMessage();
		}catch(err){
			return createOperationOutcome('error', 'transient', 'Error creating resource.', 500, 'STU3')
		}
	}else{
		return createOperationOutcome('error', 'transient', 'Error connnecting to database.', 500, 'STU3')
	}
}
