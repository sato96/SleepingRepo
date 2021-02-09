// Modify the message variable below to pre process data
// Modify the message variable below to pre process data

///memory heap base: 256m

//controllo il metodo per capire se fare pre processing o meno
var method = $('method');
logger.info(method);

if (method == 'POST')
{
//parso il messaggio
	message = JSON.parse(message)
	
	try{
		logger.info(message['resourceType'])
		//check se stanno mandando la risorsa giusta
		if (message['resourceType']== 'Observation');
		{
			var res=message
			var signals=res['component'];
			//creo la parte del nome comune
			p='/home/sam/resources/'+res['identifier'][0]['value'] + res['effectiveDateTime'];
			//ciclo sui segnali 
			for (i=0; i<signals.length; i++){
			
				if (res['component'][i]['valueSampledData']['data']==null){
					res['component'][i]=null;
				}
				else{
					code=res['component'][i]['code']['coding'][0]['code'];
					path=p+'_'+code+'.json'//metto '_' solo qua perché cos' recupero più facilmente la variabile mentre sto sul db
					var signal = res['component'][i];
					res['component'][i]=path
					FileUtil.write(path, false, JSON.stringify(signal));	
				}
			}
			message = res;
			message=JSON.stringify(message);
			logger.info(message)
		
		}
		
		return message;
	}catch(err){
		return FhirUtil.createOperationOutcome('error', 'invalid', "Invalid resource", 'R4');
	}
	
}
else if (method == "GET")
{

	//devo passare un response positivo alla source
	logger.info(message);
	message='{"response":200}';
	return message;
	}
