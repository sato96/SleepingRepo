


//funzione per la preparazione a mandare i dati. Non ha né input né output perché prende le informazioni direttamente dal'html
function sendData()
{
	perm = dataPermission();
	if (perm == true)
	{
		//prendo i file
		files = document.getElementById("file").files;
		//prendo al variabile di appoggio per il conteggio dall'elemento html
		//è una stringa ma la divido in un array
		total = document.getElementById("count").value.split(".");
		//all'inizio metto il totale dei file
		total[0] = files.length.toString();
		document.getElementById("count").value = total.join(".")
		//ciclo sui file ed eseguo l'upload
		for (var i = 0; i < files.length; i++)
		{

			var fil = files[i]
			console.log(fil);
			upload(fil, files.length);

		}
	

	}
}

//funzione che effetttua la richiesta post di upload. Input: byte file, int nfile
function upload(file, nfile)
{
	//instanzio un oggetto per le request http
    var xhr = new XMLHttpRequest();
    //aggiungo due funzione ad evento che indicano il progresso dell'invio (asincrono)
    xhr.upload.addEventListener('progress', function(event) 
    {
      console.log('progess', file.name, event.loaded, event.total);
    });
    xhr.addEventListener('readystatechange', function(event) 
    {
      console.log(
        'ready state', 
        file.name, 
        xhr.readyState, 
        xhr.readyState == 4 && xhr.status
      );

  	//metto il  pulsante del caricamento
      	document.getElementById("Up").style.display = 'none';
		document.getElementById("load").style.display = 'block';
	//quando ho fatto l'invio e ho un feedback
      if (xhr.readyState == 4 && xhr.status)
      {

 
      	//setto il codice http

    	code = xhr.status;
    	console.info(file. name + " <httpResponse "+code+">")
    	c = parseInt(code)/100;
    
    	//ottengo la classe di errori http (meno preciso ma più comprensibile)
    	//comunque fino all'ultimo mi trascino il codice errere in modo che un tecnico può capire meglio
    	c = Math.floor(c)



    	if (c == 2)
    	{
  			//alert(file.name + ": done!")

			code = "ok";

    	}
    	else if (c == 4)
    	{
    		//alert(file.name +": error "+ code)
 

			code = "unsupported media";

    	}

   		else if (c == 5)
    	{
   

			code = "internal server error";

    	}
    	else
    	{
    		code = "<httpResponse " + code + ">";
    	}
    	//prendo il count dal response: in pratica è il numero dei file che hanno fatto
    	//utilizzo un elemento html nascosto per tenere il conto di quanti file hanno finito
	  	total = document.getElementById("count").value.split(".");
		console.info(total);
		tmp = parseInt(total[1]) + 1;
		total[1] = tmp.toString();
		document.getElementById("count").value = total.join(".");
		//qui prendo il report cioè l'esito del singolo file e lo salvo in un altro elemento html nascosto
    	var report = document.getElementById("report").value;
		report = report + file.name + ": " + code + ", ";
		document.getElementById("report").value = report;
    	if (tmp == nfile)
    	{
    		//se ho finito mostro gli esiti e ricarico la pagina
    		var report = document.getElementById("report").value;
    		report = report.substring(0, report.length-2);
    		alert(report)
	     	document.getElementById("Up").style.display = 'block';
			document.getElementById("load").style.display = 'none';
			location.reload();
    	}
      	
      }
     
    });
    //comunicazione asincrona
    xhr.open('POST', "/?action=upload", true);
    xhr.setRequestHeader('X-Filename', file.name);

    console.log('sending', file.name, file);
    xhr.send(file);
}

//funzione che controlla se hai confermato la mail. Non permette di fare download o upload se non confermi
function dataPermission()
{
		flag=false
		var cookies = document.cookie.split(";");
		for (var i = 0; i < cookies.length; i++)
		{   
			var spcook =  cookies[i].split("=");  

			if  (spcook[0]==" confirm" || spcook[0]=="confirm")
			{

				if (spcook[1]== "True" || spcook[1]== " True")

				flag=true;
				break

			}
			
		}
		if (flag==false)
		{
			alert("Error 401: Unauthorized. Please confirm your identity.")
			
		}
	return flag
}

function getInfo()
{
	perm=dataPermission()
	if (perm==true)
	{
	//variabile per la gestione dei parametri della query
		var query={};
		//lista per i segnali
		var segnali=[];
		var signals = document.getElementById("signals").elements;
		//prendo i segnali e li metto in una lista
		for(var i = 0 ; i < signals.length ; i++)
		{
			if (signals.item(i).checked==true)
			{
				segnali.push(signals.item(i).value);
			}
		}
		if (segnali!=0)
		{
			query["Information"]=segnali;
			//qua scorro gli elementi e mi aggiusto per inseriri i parametri che fungeranno da filtro nella query
			filter=document.getElementById("filter").elements;
			var filt;
			console.log(filter.length)
			for (var i=0; i<filter.length;i=i+2)
			{

				if (filter.item(i).name=="performer")
				{	
					if (filter.item(i).value=="ALL")
					{
						filt="ALL_";
		
					}
					else
					{

						var name=whoAmI();
						filt=filter.item(i).value+"_"+name;
					}
				}
				//qui è da vedere bene
				else if (filter.item(i).name=="performer.issuer.display")
				{
					console.log(filter.item(i).value)
					console.log(filter.item(i+1).value)
					filt = [];
					if (filter.item(i).value=="ALL" || (filter.item(i).value=="=" && filter.item(i+1).value == "") )
					{
						filt = [];
					}
					else if (filter.item(i).value=="=" && filter.item(i+1).value != "")
					{
						var list = filter.item(i+1).value.replace(", ", ",");
						list = list.split(",");
						console.log (list)
						filt=list;

					}

					else
					{
						filt.push(filter.item(i).value);
					}
				}
				else
				{
					if (filter.item(i).value!="ALL" && filter.item(i+1).value=="")
					{
						filt= "ALL_";
					}
					else
					{
						filt=filter.item(i).value+"_"+filter.item(i+1).value
					}
					
					
				}
				query[filter.item(i).name]=filt;
			}

				query=JSON.stringify(query);
				download(query)
		}
		else
		{
			alert("You must select at least one signal!")
		}
	}
		
		
}
//funzione che prende il nome utente e lo ritorna
function whoAmI()
{
		var user=""
		var cookies = document.cookie.split(";");
		for (var i = 0; i < cookies.length; i++)
		{   
			var spcook =  cookies[i].split("="); 
			console.log(spcook) 

			if  (spcook[0]==" uname")
			{
				user=spcook[1]

			}
			
		}
		return user
}

//funzione per il download. Input string query
function download(query)
{
//nel funzionamento è quasi uguale ad upload
    var xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', function(event) 
    {
      console.log('progess', query, event.loaded, event.total);
    });
    xhr.addEventListener('readystatechange', function(event) 
    {
      console.log(
        'ready state', 
        query, 
        xhr.readyState, 
        xhr.readyState == 4 && xhr.status
      );

      	document.getElementById("Down").style.display = 'none';
		document.getElementById("load").style.display = 'block';
      if (xhr.readyState == 4 && xhr.status)
      {
      	console.info(xhr.status)
      	
      	document.getElementById("Down").style.display = 'block';
		document.getElementById("load").style.display = 'none';

      	response=JSON.parse(xhr.responseText);
    	//code=response["code"];
    	code = xhr.status;
    	console.info(response)

    	if (code=="200")
    	{

    		alert("Done! " + response["count"])
    		var utc = new Date().toJSON().slice(0,10).replace(/-/g,'_');
    		file = JSON.parse(response['data']);
    		downloadObjectAsJson(file, "bundle_"+String(utc))
      		location.reload();
    	}
    	else
     	{
      		alert("Error: "+ code)
      		location.reload();
      	}
      	
      }
     
    });

    xhr.open('POST', "/?action=download", true);
    xhr.setRequestHeader('X-Filename', query);

    console.log('sending', query, query);
    xhr.send(query);
}
//funzione per fare il download del file bundle

function downloadObjectAsJson(exportObj, exportName){
	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
	var downloadAnchorNode = document.createElement('a');
	downloadAnchorNode.setAttribute("href",     dataStr);
	downloadAnchorNode.setAttribute("download", exportName + ".json");
	document.body.appendChild(downloadAnchorNode); // required for firefox
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
}

function upHandle(){


	var fileInput = document.getElementById('file');
	var filenameContainer = document.querySelector('#filename');
	var dropzone = document.querySelector('.div');


	fileInput.addEventListener('change', function() {
		file = fileInput.files;
		var names="";

		for (var i = 0; i < file.length; i++)
		{

			var fil = file[i].name;
			names = names + fil + ", ";
			

		}
		names = names.substring(0, names.length-2);
		console.log(names)
		document.getElementById('div').textContent = names;

	
	});

	fileInput.addEventListener('dragenter', function() {
		dropzone.classList.add('dragover');
	});

	fileInput.addEventListener('dragleave', function() {
		dropzone.classList.remove('dragover');
	});
}
