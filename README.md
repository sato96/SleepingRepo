# SleepingRepo
Tesi di laurea magistrale in eHealth al Politecnico di Torino
La tesi si pone come obiettivo quello di raccogliere i dati sul sonno, di convertirli secondo lo standard FHIR e salvare il tutto in un database.

# Come farlo funzionare
Le due cartelle sono i due dispostivi che vengono inizializzati (se uno vuole può mettere il db su un altro pc in lan ma vabe inutile). Uno è il pc che deve avere un ip pubblico in modo da essere raggiungibile anche dalle Molinette, per esempio. L'altro deve essere letteralmente trincerato perché non ha manco la connessione crittografata. In più è quello dove sono i dati. Le cartelle devono avere la struttura che hanno su github altrimenti i path non corrispondono. Inoltre i codici sono scritti sono linux per linux. Non vengono impartiti comandi bash però i percorsi sono con  '/' anziché con '\' che usa Windows, quindi se si usa su Windows non funziona niente. Se si vuole usare Windows (capisco che molti si trovino meglio) forse si può usare il nuovo kernel linux che Microsoft ha implementato. Altrimenti si devono cambiare a mano i path (forse avrei dovuto mettere qualcosa di più comodo per cambiare os, non ci ho pensato sinceramente). Sul webserver si usa Python3 (html javascript e css non hanno problemi). Sulla pagina non ho usato alcun framework di JavaScript (era un po' più semplice da fare e non essendo un web designer a me importava che le interfacce fossero solo chiare e JavaScript normale fa il suo lavoro). Come librerie ci sono tutte le dipendenze. In fase di debug va benissimo lanciare webpage.py con il comando: 
``` Bash
sudo Python3 webpage.py
```
(è richiesto sudo perché si sta in lan e non in localhost). Per l'implementazione serve gunicorn. Al momento in cui scrivo ho fatto qualche esperimento ma non ho mai provato con mano, perché non ho mai avuto un indirizzo pubblico (avevo provato con noip ma flask, il framework scelto, ha dato problemi, a differenza del defunto cherrypy, ma non ho approfondito). Come raccomanda flask stesso da terminale in fase di debug usare gunicorn. Si raccomanda di dare uno sguardo alla tesi in ogni caso perché dovrebbe esserci gran parte del necessario.
L'altro pc richiede installato Mirth connect della NextGen Healthcare. Nel readme nella cartella c'è link al sito. Non è difficile da installare, sopratutto su Windows. Su Linux ha un solo grande problema: OpenJDK. Se non si ha la versione di Java fornita da Oracle non va e su Linux è un po' complicato installarla. Nel dubbio allego la guida che ho seguito io (https://docs.datastax.com/en/jdk-install/doc/jdk-install/installOracleJdkDeb.html). Una volta installato su linux bisogna stare un po' attenti ai permessi dei file, soprattutto per installare le estensioni, perché sono operazioni che non possono essere fatte con sudo, ma essendo file piazzati tra quelli di sistema l'os richiede i permessi da amministratore. Il comando in bash dovrebbe essere questo se non vado errato: 
```Bash
sudo chmod -R a=,+rwX dir
``` 
In ogni caso basta vedere la documentazione di chmod o da terminale si può fare così:
```Bash
chmod --h
```
Mirth è composto dal server e dall'administrator panel. Quest'ultimo è installabile anche su un altro pc, magari il proprio computer portatile. Bisogna comunque stare nella stessa rete del server, dato che, come si diceva prima, non ci si può fidare di aprire le porte finché non c'è una comunicazione con il protocollo https.

# Tips
I certificati per la crittografia ssl che ho caricato nella cartella webpage sono "self signed". Si possono usare ma se la cosa si fa seria io proverei a farlo firmare da let's encrypt, per esempio, perché è gratis e non da noie con la privacy. Cioè la sicurezza del certificato e della chiave c'è ma siccome non è firmato da un ente un browser che si connette al portale avvertirà l'utente che potrebbero esserci problemi di sicurezza (perché appunto non c'è nessuno che ha dato l'ok su quel certificato). Come dicevo se un medico vede sta roba potrebbe impanicarsi un po' se non gli si spiega bene.
Come dicevo anche nella tesi se si vuole star sicuri i file json nel webserver dove vengono salvati gli utenti vanno crittografati.
Le cose da aggiungere sono nella tesi, nella parte "Sviluppi futuri". Per favore continuate perché c'è tanto lavoro da fare!
Non ho usato librerie standard per FHIR, tranne che con la risorsa bundle, per semplicità. Dovrebbero esserci comunque delle librerie Python. Utile se si volesse aggiungere il supporto a FHIR anche in XML. In Java, appunto le ho già usate e c'è tutto se si vuole usare qualcosa di pre fabbricato in Javascript. Si consideri, però che quando vengono caricati i dati sul database faccio un giochino per alleggerire il carico sul middleware 
Penso sia tutto.

# Come aggiungere segnali
Se si vuole aggiungere un segnale bisogna modificare il file download.html e inserire il nome del segnale nella tabella giusta. Poi bisogna aggiungere il segnale alla look_up_table ed eventualmente nei metodi di conversione in FHIR (tranne quando si prende già un json). Poi spostandosi su Mirth bisogna cambiare la trafila di if in create e aggiungendo il segnale e cambiare in search la lunghezza del segnale. Infine si aggiunge il segnale al db. NB in fase di create non sono riuscito a fare meglio. Avrei potuto fare un ciclo per tirare fuori qualcosa di più generico ma ho bisogno di assegnare ad una variabile il valore nell'ordine giusto. Non conscendo l'ordine di arrivo nei messaggi (un json per definizione non è una collezione ordinata di dati) non ho saputo fare di meglio.




