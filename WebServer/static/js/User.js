
//funzione per il login

function login() {
    var data = formElement();
    http= new XMLHttpRequest();
    console.log(data);
    http.open("post", "/?action=login", false);
    http.send(data);

    //code=JSON.parse(http.responseText);

    code = http.status;

    if (code == 200) {
    	console.log("ok")

        document.location = "download";
    } else {
        alert("Incorrect username and/or password.");
    }
}

function subscribe(){

    console.log(form.role.value);
    var data = formElement();
    data = JSON.parse(data);
    //primo check: controllo se le password sono uguali
    if (data["psw"]==data["psw2"])
    {
        //secondo check: controllo se è un ricercatore per la consistenza del campo "institute"
        if (data["role"]=="researcher"){
            
   
            if (data["institute"]=="personalized"){
                if (data["institute1"]=="")
                {
                    alert('You must insert your Instute!')
                }
                else
                {
                    data["institute"]=data["institute1"];
                }
            
            }
        }
        //altrimenti non metto l'istituzione. In realtà questa parte di codice ora non serve è inserite per ampliare in futuro il sistema
        else
        {
            data["instiute"]="";
        }

        data=JSON.stringify(data);

    var xhr = new XMLHttpRequest();
    //parte che invia il codice in modo sincrono. Mi serve per avere un feedback e fare la schermata di caricamento
    xhr.upload.addEventListener('progress', function(event) 
    {
      console.log('progess', data, event.loaded, event.total);
    });
    xhr.addEventListener('readystatechange', function(event) 
    {
      console.log(
        'ready state', 
        data, 
        xhr.readyState, 
        xhr.readyState == 4 && xhr.status
      );


        document.getElementById("sign").style.display = 'none';
        document.getElementById("load").style.display = 'block';
      if (xhr.readyState == 4 && xhr.status)
      {
        code=JSON.parse(xhr.responseText);
        code=xhr.status;;
        console.log(code)
        document.getElementById("sign").style.display = 'block';

        document.getElementById("load").style.display = 'none';
        if (code=="200")
        {
            document.location = "login";
            alert("Check your email to confirm your identity, then you can dowload and uploade files");
        }
        else
        {
            alert("An error occured: maybe you've already signed up or there's a internal server error");
            location.reload();
        }
        
      }
     
    });

    xhr.open('POST', "/?action=subscribe", true);
    
    console.log('sending', data);
    xhr.send(data);
    }
    else
    {
        //metti che devono coincidere le password
        alert("Passwords must match!")
    }

}
//funzione per resettare la passwrd
function resetmail(){
    var data = formElement();
    http= new XMLHttpRequest();
    http.open("post", "/?action=reset", false);
    http.send(data);
    
    code=JSON.parse(http.responseText);
    code=http.status;;
    console.log(code);
    if (code == 200) {
        console.log("ok")
        alert("Your email has been sent! Please check your email box.");
    } else {
        alert("Something has gone wrong: code"+ code);
    }

}
//funzione per cambiare la password
function changepsw(){

    var data = formElement();
    http= new XMLHttpRequest();
    http.open("PATCH", "/?action=change", false);
    http.send(data);
    
    code=JSON.parse(http.responseText);
    code=http.status;
    console.log(code);
    if (code == 200) {
        console.log("ok")
        document.location = "login";
    } else {
        alert("Something has gone wrong: code"+ code);
    }
}
//funzione che prende gli elementi dal form e li mette in un json
//come output ha un json a stringa pronto per essere mandato

function formElement() {
    var elements = document.getElementById("form").elements;
    console.log(elements)
    var obj ={};
    for(var i = 0 ; i < elements.length ; i++){
        var item = elements.item(i);
        if (item.name=="rememberMe")
        {
            obj[item.name] = item.checked;
        }
        else
        {
            obj[item.name] = item.value;
        }
        console.log(item.name)
    }
    obj=JSON.stringify(obj);
    console.log(obj)
  

    return obj
}
//funzioni che elimina tutti i cookie

function delCookie()
{
    clearListCookies();
    
    window.location = ""; // refresh della pagina

}

function clearListCookies()
{   
    var cookies = document.cookie.split(";");
    console.log(cookies)
    for (var i = 0; i < cookies.length; i++)
    {   
        var spcook =  cookies[i].split("=");
        deleteCookie(spcook[0]);
    }
}
function deleteCookie(cookiename)
    {
        var d = new Date();
        d.setDate(d.getDate() - 1);
        var expires = ";expires="+d;
        var name=cookiename;
        //alert(name);
        var value="";
        document.cookie = name + "=" + value + expires + "; path=/";                    
    }

//funzione che controlla i permessi. Serve a proteggere le risorse dove si possono ricevere/inviare dati
function checkPermission()
{       
        var flag=false;
        var cookies = document.cookie.split(";");
        console.info(cookies)
        for (var i = 0; i < cookies.length; i++)
        {   
            var spcook =  cookies[i].split("=");  
            console.log(spcook[0]);
            if  (spcook[0]=="uname" || spcook[0]==" uname" )
            {
                console.log("in if")
                flag=true;
                break

            }
            
        }
        if (flag==false)
        {
            alert("Error 401: Unauthorized. Please login first.")
            document.location = "login";
        }
}

//funzione che sceglie cosa mostrare nella navbar in base anche a dove ci si trova e all'essersi loggati o meno. 
//serve a risolvere un bug: quando ero in login non avevo inserito tutti i componenti nella navbar ma se avessi premuto qualcosa come about avrei avuto a disposizione download

function dispNavbar()
{
    var flag=false;
    var down = document.getElementById("down");
    var up = document.getElementById("up");
    var inp = document.getElementById("in");
    var out = document.getElementById("out");
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++)
    {   
         
        var spcook =  cookies[i].split("=");  
        console.log(spcook[0]);  
        if  (spcook[0]==="uname")
        {
            flag=true;
            break

        }
            
    }
    console.log(flag)
    if (flag==false)
    {
        up.style.display="none";
        down.style.display="none";
        out.style.display="none";
    }
    else
    {
        inp.style.display="none";
    }

}

//Funzione per fare un get e prendere gli enti già registrati da mostrare nel menu a tendina

function getInstitutes()
{
    http= new XMLHttpRequest();
    http.open("get", "/institute", false);
    http.send();
    
    var inst=JSON.parse(http.responseText);
    inst= inst['institutes']
    var select = document.getElementById("institute");
    for (var ind = 0; ind < inst.length; ind++)
    {
        var op = document.createElement("option");
        op.setAttribute("value", inst[ind]);          // valori possibili da scegliere
        op.append(inst[ind]);
        select.append(op);
    }
}
//Funzione che attiva/disattiva il campo dove si può inserire un ente o id personalizzato
function Personalize(event)
{
    sel=this.options[this.selectedIndex].text;
    console.info(sel)
    var id=this.id +"1";
    console.info(id)
    if (sel!="Personalized")
    {
        document.getElementById(id).readOnly=true;
        document.getElementById(id).required = false;
        document.getElementById(id).value = "";

    }
    else
    {
        console.info("elseee")
        document.getElementById(id).readOnly=false;
        document.getElementById(id).required = true;
    }
    console.info(document.getElementById(id).readOnly);
    console.info(document.getElementById(id).required);
}

