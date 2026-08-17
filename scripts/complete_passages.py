import json

rp = json.load(open("data/reading_passages.json", encoding="utf-8"))
by_id = {p["id"]: p for p in rp}

# ---- Accented Spanish texts (same content, corrected orthography) ----
TEXTS = {
1: "En México, la noche del 15 de septiembre tiene un significado especial. En plazas de todo el país, miles de personas se reúnen para escuchar la ceremonia conocida como el Grito. Esta conmemoración recuerda el llamado a levantarse contra el dominio español realizado en 1810 por Miguel Hidalgo y Costilla, en Dolores. Aunque no existe un registro textual único de las palabras exactas de ese primer llamado, históricamente se reconoce como el inicio de la lucha de Independencia. Con el paso del tiempo, la ceremonia evolucionó y se convirtió en un acto cívico nacional. Hoy, autoridades de distintos niveles repiten la ceremonia en sus localidades, mientras la gente porta banderas, escucha música regional y participa en festejos comunitarios. En ese contexto, el simbolismo patrio tiene un papel central: los colores verde, blanco y rojo aparecen en edificios, ropa y decoraciones. Comprender esta celebración ayuda a entender por qué septiembre es considerado mes patrio y por qué el Grito no es solo una fiesta, sino también una memoria compartida de identidad histórica.",
2: "Los refranes forman parte de la vida cotidiana en México. Son frases breves que transmiten experiencia, consejo o una forma de ver la realidad. Muchas veces se usan para orientar una decisión sin dar una explicación larga. Por ejemplo, cuando alguien dice «Más vale tarde que nunca», sugiere que es preferible completar una acción, aunque sea después del momento ideal. Otro refrán muy conocido es «Al mal tiempo, buena cara», que invita a mantener una actitud positiva frente a las dificultades. También se escucha «A darle que es mole de olla», expresión que anima a comenzar una tarea con energía. El valor de estos dichos no está solo en su significado literal, sino en su función social: permiten resumir ideas complejas en pocas palabras y facilitan la comunicación entre generaciones. En muchos hogares, abuelos y padres comparten refranes con niñas, niños y jóvenes como parte de una educación informal. Así, el lenguaje popular se convierte en una vía para conservar memoria cultural y fortalecer la identidad comunitaria.",
9: "Las chinampas son un sistema agrícola tradicional desarrollado en zonas lacustres del Valle de México. Consisten en parcelas construidas de forma artificial sobre aguas someras, con técnicas que permiten alta productividad y manejo cuidadoso del entorno. En Xochimilco, este método ha sostenido por siglos la producción de hortalizas, flores y plantas de consumo local. Su valor no es solo económico: también representa conocimiento histórico sobre suelos, agua y biodiversidad. Por esa razón, se considera un patrimonio cultural y ambiental de gran relevancia. Aunque hoy enfrenta presiones urbanas y ambientales, diversas comunidades y proyectos trabajan para conservarlo mediante restauración ecológica, reforestación y fortalecimiento productivo. En una lectura de examen, este tipo de texto puede incluir preguntas sobre la función de las chinampas, su origen histórico y los riesgos actuales que enfrentan. Comprenderlo exige relacionar técnica tradicional con sostenibilidad y vida comunitaria en la ciudad.",
10: "Cada año, millones de mariposas monarca viajan miles de kilómetros desde Norteamérica hasta los bosques templados de México, principalmente en Michoacán y el Estado de México. Este fenómeno migratorio destaca por su precisión y continuidad, pues las colonias regresan de manera recurrente a zonas de hibernación. La región ha sido reconocida por su relevancia ecológica y por el valor cultural que las comunidades locales le atribuyen. En algunos contextos, la llegada de la monarca coincide con temporadas de memoria y celebración comunitaria, lo que fortalece su simbolismo. La conservación de estos bosques requiere acciones coordinadas: manejo forestal, vigilancia, restauración y participación social. Por eso, estudiar la monarca no significa solo conocer una especie; implica entender la relación entre biodiversidad, territorio y cultura. En ejercicios de comprensión, suelen preguntarse datos de ubicación, finalidad de protección y mensaje central del texto.",
11: "El mariachi es una expresión musical ampliamente reconocida como símbolo de México. Su evolución incluye una vertiente tradicional de cuerdas y otra moderna que incorpora trompetas, vihuela, guitarrón y violines en formaciones más amplias. A lo largo del tiempo, su repertorio ha integrado sones, jarabes, corridos, valses y canciones rancheras, entre otros géneros. Más que un estilo sonoro, el mariachi funciona como práctica social: se interpreta en fiestas familiares, celebraciones comunitarias y actos cívicos. También ha sido una vía de transmisión intergeneracional de memoria local, lenguaje y afecto por la región de origen. En diversos espacios culturales se reconoce su papel como patrimonio inmaterial por su capacidad de articular identidad y pertenencia. En lectura de comprensión, este tema suele evaluar si la persona distingue entre características del mariachi tradicional y del moderno, y si identifica su importancia cultural más allá de la música.",
12: "La cocina tradicional mexicana se entiende como un patrimonio vivo que une ingredientes, técnicas, saberes comunitarios y celebraciones. Su valor cultural no depende de un solo platillo, sino de una red de prácticas que inicia en el campo y continúa en mercados, cocinas familiares y fiestas locales. El maíz ocupa un lugar central en ese sistema, junto con procesos como la nixtamalización, el uso de comales y las preparaciones regionales que cambian según territorio y temporada. En 2010, esta cocina fue inscrita en la Lista Representativa del Patrimonio Cultural Inmaterial de la Humanidad, reconocimiento que subraya su relevancia social y su capacidad de transmitir conocimiento entre generaciones. El texto también destaca la dimensión de sostenibilidad: proteger semillas, valorar a los productores locales y mantener las técnicas tradicionales fortalece comunidades y ecosistemas. En comprensión lectora, suelen aparecer preguntas sobre la idea principal, la fecha de reconocimiento y la relación entre alimentación e identidad.",
13: "Los alebrijes son figuras fantásticas del arte popular mexicano, elaboradas tradicionalmente en cartonería y madera policromada, según la región. En la narrativa más difundida, su origen moderno se asocia al artesano Pedro Linares, quien imaginó criaturas de formas inesperadas y gran colorido. Con el tiempo, esta expresión creció en talleres familiares, ferias, desfiles y espacios culturales. Más allá de lo visual, los alebrijes representan creatividad colectiva y transmisión de oficio entre generaciones. Muchas piezas combinan rasgos de varios animales para construir un ser simbólico único, lo que permite experimentar con identidad, imaginación y memoria local. En algunas ciudades, su elaboración se ha reconocido como patrimonio cultural intangible por su importancia artística y comunitaria. En una lectura de comprensión, este tema permite evaluar si se identifican origen, materiales y función cultural de la artesanía sin reducirla a un objeto decorativo.",
14: "El nombre Popocatépetl proviene del náhuatl y se interpreta como «montaña que humea». Esta denominación refleja la observación histórica de su actividad volcánica y la relación que los pueblos del altiplano han mantenido con el entorno. Desde tiempos prehispánicos, las fumarolas del volcán se han asociado con fuerza, respeto y significado ritual. Su presencia domina el paisaje de regiones cercanas a Puebla, Estado de México y Morelos, donde ha influido en rutas, asentamientos y relatos locales. El texto subraya que un volcán puede leerse desde dos planos: el científico, que estudia procesos geológicos, y el cultural, que conserva memorias, leyendas y prácticas comunitarias. En comprensión lectora, esta combinación de perspectivas obliga a distinguir dato lingüístico, descripción natural e interpretación simbólica. Al hacerlo, la persona lectora demuestra que no solo identifica información puntual, sino también la estructura de sentido que une territorio e historia.",
15: "El Parque Nacional Iztaccíhuatl-Popocatépetl es una de las áreas naturales protegidas más conocidas del centro de México. Su importancia radica en la biodiversidad, los servicios ambientales y la función hidrológica que cumple para regiones cercanas. En sus montañas y valles existen ecosistemas que ayudan a regular el clima, conservar suelos y mantener procesos biológicos clave. También tiene valor histórico: en su entorno se desarrollaron comunidades que domesticaron cultivos fundamentales para la dieta local, como maíz, frijol y calabaza. Este doble carácter, natural y cultural, explica por qué su conservación exige estrategias de largo plazo y participación social. No se trata solo de proteger paisajes: se trata de sostener condiciones de vida para poblaciones humanas y no humanas. En comprensión lectora, un texto así puede preguntar por el objetivo de protección, ejemplos de biodiversidad o la relación entre patrimonio natural y conocimiento comunitario.",
}

# ---- Accented questions (same order/content; keep question_en as-is) ----
QUESTIONS = {
1: [
("¿Qué se conmemora en la ceremonia del Grito?", ["La consumación de la Independencia","El inicio de la lucha de Independencia","La Revolución Mexicana","La promulgación de la Constitución de 1917"], "El inicio de la lucha de Independencia"),
("¿En qué año se ubica históricamente el llamado de Hidalgo?", ["1810","1821","1857","1910"], "1810"),
("¿Qué elemento se menciona como parte del simbolismo patrio?", ["Los colores verde, blanco y rojo","Solo fuegos artificiales","Únicamente música clásica","Escudos regionales extranjeros"], "Los colores verde, blanco y rojo"),
("Según el texto, el Grito actual se entiende principalmente como:", ["Un acto comercial","Una ceremonia cívica con memoria histórica","Un evento deportivo","Una celebración privada"], "Una ceremonia cívica con memoria histórica"),
("¿Qué afirma el texto sobre las palabras exactas del primer Grito?", ["Se conservan en audio original","No existe un registro textual único","Fueron dictadas por el Congreso","Se escribieron un siglo después por decreto"], "No existe un registro textual único"),
("¿Por qué septiembre se considera mes patrio en el texto?", ["Por ser fin de cosecha","Por la conmemoración del inicio de la Independencia","Por el inicio de clases","Por una tradición exclusivamente religiosa"], "Por la conmemoración del inicio de la Independencia"),
],
2: [
("¿Para qué se usan principalmente los refranes en el texto?", ["Para reemplazar leyes","Para resumir consejos y experiencias","Para escribir documentos técnicos","Para traducir idiomas extranjeros"], "Para resumir consejos y experiencias"),
("¿Qué idea transmite «Más vale tarde que nunca»?", ["Nunca hay que intentar","Es mejor no actuar","Es preferible hacer algo tarde que no hacerlo","Solo importa la rapidez"], "Es preferible hacer algo tarde que no hacerlo"),
("¿Qué sugiere «Al mal tiempo, buena cara»?", ["Ignorar los problemas","Mantener actitud positiva ante dificultades","Evitar conversar","Cambiar de ciudad"], "Mantener actitud positiva ante dificultades"),
("¿Cómo interpreta el texto «A darle que es mole de olla»?", ["Detener una actividad","Comenzar una tarea con energía","Preparar comida diariamente","Evitar el trabajo en equipo"], "Comenzar una tarea con energía"),
("¿Qué papel tienen las familias en la transmisión de refranes?", ["No participan","Solo los escriben en libros","Los comparten como educación informal","Los sustituyen por lenguaje técnico"], "Los comparten como educación informal"),
("Según el texto, los refranes ayudan a:", ["Debilitar la identidad comunitaria","Conservar memoria cultural","Eliminar diferencias regionales","Reducir vocabulario"], "Conservar memoria cultural"),
],
9: [
("¿Qué son las chinampas según el texto?", ["Parcelas agrícolas tradicionales construidas sobre aguas someras","Fortalezas de piedra","Mercados flotantes","Canales de riego para ganado"], "Parcelas agrícolas tradicionales construidas sobre aguas someras"),
("¿Qué ha sostenido por siglos el método de Xochimilco?", ["Producción de hortalizas, flores y plantas","Extracción minera","Pesca marítima","Fabricación textil"], "Producción de hortalizas, flores y plantas"),
("Además del valor económico, ¿qué representan las chinampas?", ["Conocimiento histórico sobre suelos, agua y biodiversidad","Tecnología militar","Ceremonias religiosas","Rutas de comercio internacional"], "Conocimiento histórico sobre suelos, agua y biodiversidad"),
("¿Qué presiones enfrenta hoy este sistema?", ["Presiones urbanas y ambientales","Solo cambios de clima","Falta de turistas","Exceso de tierras"], "Presiones urbanas y ambientales"),
("¿Cómo intentan conservar las chinampas las comunidades?", ["Restauración ecológica y reforestación","Cerrando los canales","Eliminando vegetación","Construyendo viviendas"], "Restauración ecológica y reforestación"),
("¿Qué relación exige comprender las chinampas?", ["Técnica tradicional, sostenibilidad y vida comunitaria","Industria y banca","Minería y puertos","Moda y espectáculo"], "Técnica tradicional, sostenibilidad y vida comunitaria"),
],
10: [
("¿A dónde llegan las mariposas monarca según el texto?", ["Bosques de Michoacán y Estado de México","Selvas de Chiapas y Tabasco","Playas de Baja California","Valles de Sonora"], "Bosques de Michoacán y Estado de México"),
("¿Qué destaca del fenómeno migratorio?", ["Precisión y continuidad anual","Cambio diario de ruta local","Ausencia de ciclos","Migración exclusivamente nocturna urbana"], "Precisión y continuidad anual"),
("¿Qué tipo de valor tiene la región además del ecológico?", ["Valor cultural comunitario","Uso industrial pesado","Únicamente valor inmobiliario","Solo valor deportivo"], "Valor cultural comunitario"),
("¿Qué requiere su conservación?", ["Acciones coordinadas de manejo y participación social","Solo publicidad","Cierre total de comunidades","Eliminar vegetación local"], "Acciones coordinadas de manejo y participación social"),
("¿Qué relación central propone el texto?", ["Biodiversidad, territorio y cultura","Moneda y comercio internacional","Minería y puertos","Moda y espectáculo"], "Biodiversidad, territorio y cultura"),
("¿Qué tipo de preguntas menciona el texto para comprensión?", ["Ubicación, protección y mensaje central","Solo ortografía técnica","Cálculo de impuestos","Historia de inventos europeos"], "Ubicación, protección y mensaje central"),
],
11: [
("¿Qué instrumentos se mencionan en la variante moderna?", ["Trompetas, violines, vihuela y guitarrón","Piano y flauta transversal","Solo batería eléctrica","Saxofón y acordeón exclusivamente"], "Trompetas, violines, vihuela y guitarrón"),
("¿Qué géneros se citan dentro del repertorio?", ["Sones, jarabes y corridos","Ópera italiana exclusivamente","Jazz contemporáneo únicamente","Música electrónica de club"], "Sones, jarabes y corridos"),
("¿Cómo define el texto al mariachi además de estilo musical?", ["Práctica social y cultural","Método de construcción","Sistema de transporte","Disciplina militar"], "Práctica social y cultural"),
("¿En qué espacios suele interpretarse?", ["Fiestas familiares, comunidad y actos cívicos","Solo auditorios cerrados","Solo universidades extranjeras","Solo ceremonias deportivas"], "Fiestas familiares, comunidad y actos cívicos"),
("¿Qué reconoce su declaratoria cultural?", ["Su papel en identidad y pertenencia","Su utilidad industrial","Su función bancaria","Su uso médico"], "Su papel en identidad y pertenencia"),
("¿Qué puede evaluar una pregunta de comprensión sobre este tema?", ["Diferencias entre mariachi tradicional y moderno","Solo velocidad de lectura","Caligrafía artística","Memoria de fechas sin contexto"], "Diferencias entre mariachi tradicional y moderno"),
],
12: [
("¿Cómo define el texto la cocina tradicional mexicana?", ["Patrimonio vivo de prácticas comunitarias","Conjunto de recetas importadas","Industria exclusivamente urbana","Lista fija de un solo estado"], "Patrimonio vivo de prácticas comunitarias"),
("¿Qué ingrediente se menciona como central?", ["Maíz","Trigo","Avena","Centeno"], "Maíz"),
("¿En qué año se reconoce en la Lista Representativa?", ["2010","2008","2015","2020"], "2010"),
("¿Qué aspecto resalta el reconocimiento internacional?", ["Transmisión social y cultural del conocimiento","Uso exclusivo de maquinaria","Homogeneidad nacional obligatoria","Sustitución total de técnicas tradicionales"], "Transmisión social y cultural del conocimiento"),
("¿Qué dimensión adicional menciona el texto?", ["Sostenibilidad y apoyo a productores locales","Espectáculo deportivo","Mercados financieros","Turismo de lujo exclusivamente"], "Sostenibilidad y apoyo a productores locales"),
("¿Qué tipo de pregunta de comprensión puede aparecer?", ["Idea principal y fecha de reconocimiento","Fórmulas químicas avanzadas","Historia de la aviación","Pronunciación en latín"], "Idea principal y fecha de reconocimiento"),
],
13: [
("¿Qué son los alebrijes según el texto?", ["Figuras fantásticas del arte popular","Instrumentos musicales","Trajes ceremoniales","Edificios históricos"], "Figuras fantásticas del arte popular"),
("¿Con qué artesano se asocia su origen moderno?", ["Pedro Linares","Diego Rivera","José María Velasco","Enrique Carbajal"], "Pedro Linares"),
("¿Qué materiales se mencionan?", ["Cartonería y madera policromada","Solo acero","Solo vidrio","Concreto y mármol"], "Cartonería y madera policromada"),
("¿Qué representan culturalmente además de su aspecto visual?", ["Creatividad colectiva y oficio familiar","Normas fiscales","Tecnología militar","Manual de arquitectura"], "Creatividad colectiva y oficio familiar"),
("¿Cómo se construye un ser simbólico en estas piezas?", ["Combinando rasgos de varios animales","Repitiendo una sola forma","Copiando planos técnicos","Usando fotografía oficial"], "Combinando rasgos de varios animales"),
("¿Qué busca evaluar el texto en comprensión lectora?", ["Origen, materiales y función cultural","Solo precio de mercado","Solo cantidad de pintura","Solo longitud de la pieza"], "Origen, materiales y función cultural"),
],
14: [
("¿Qué significa Popocatépetl en náhuatl según el texto?", ["Montaña que humea","Mujer blanca","Tierra del faisán","Agua profunda"], "Montaña que humea"),
("¿Qué elemento histórico refleja ese nombre?", ["Observación de su actividad volcánica","Diseño colonial de rutas","Uso de calendarios europeos","Traducción francesa moderna"], "Observación de su actividad volcánica"),
("¿Qué regiones se mencionan alrededor del volcán?", ["Puebla, Estado de México y Morelos","Sonora, Sinaloa y Nayarit","Campeche, Yucatán y Quintana Roo","Chihuahua, Durango y Coahuila"], "Puebla, Estado de México y Morelos"),
("¿Qué dos planos de lectura propone el texto?", ["Científico y cultural","Jurídico y financiero","Militar y comercial","Eléctrico y digital"], "Científico y cultural"),
("¿Qué debe distinguir la persona lectora en comprensión?", ["Dato lingüístico, descripción natural e interpretación simbólica","Solo números de altitud","Solo nombres propios","Solo fechas históricas"], "Dato lingüístico, descripción natural e interpretación simbólica"),
("¿Qué relación general muestra el texto?", ["Territorio e historia","Mercado y bolsa","Puertos y aduanas","Medicina y farmacia"], "Territorio e historia"),
],
15: [
("¿Qué tipo de espacio es Izta-Popo según el texto?", ["Área natural protegida","Zona industrial","Corredor ferroviario","Puerto comercial"], "Área natural protegida"),
("¿Qué razón principal se menciona para su importancia?", ["Biodiversidad y servicios ambientales","Explotación minera","Comercio marítimo","Turismo de playa"], "Biodiversidad y servicios ambientales"),
("¿Qué cultivos se nombran como parte de su valor histórico?", ["Maíz, frijol y calabaza","Cebada y avena","Café y cacao","Trigo y centeno"], "Maíz, frijol y calabaza"),
("¿Qué exige su conservación según el texto?", ["Estrategias de largo plazo y participación social","Solo campañas publicitarias","Cierre total de acceso","Privatización completa"], "Estrategias de largo plazo y participación social"),
("¿Qué diferencia destaca el texto sobre conservar?", ["No es solo paisaje, también condiciones de vida","Es solo estética visual","Es solo deporte de montaña","Es solo regulación de tráfico"], "No es solo paisaje, también condiciones de vida"),
("¿Qué puede preguntar un examen de comprensión con este texto?", ["Objetivo de protección y relación natural-cultural","Solo ortografía extranjera","Únicamente operaciones algebraicas","Historia de moneda colonial"], "Objetivo de protección y relación natural-cultural"),
],
}

for pid, text in TEXTS.items():
    p = by_id[pid]
    p["text"] = text
    for i, (q, opts, correct) in enumerate(QUESTIONS[pid]):
        p["questions"][i]["question"] = q
        p["questions"][i]["options"] = opts
        p["questions"][i]["correct"] = correct

# ---- Replace passage 16 with a real civic reading ----
by_id[16] = {
  "id": 16,
  "title": "El Día de la Bandera y los símbolos patrios",
  "topic": "Civismo y símbolos nacionales",
  "source_hint": "Texto educativo sobre los símbolos patrios de México",
  "text": "En México, cada 24 de febrero se celebra el Día de la Bandera, una fecha dedicada a uno de los símbolos patrios más queridos. La bandera actual está formada por tres franjas verticales: verde, blanco y rojo, con el Escudo Nacional en el centro de la franja blanca. El verde simboliza la esperanza, el blanco la unidad y el rojo la sangre de los héroes nacionales. El escudo muestra un águila real posada sobre un nopal devorando una serpiente, imagen que representa la fundación de Tenochtitlan. Junto con el Himno Nacional y el Escudo, la Bandera es uno de los tres símbolos patrios de México, y su uso está regulado por la ley. En las escuelas, los lunes se realizan honores a la bandera, una ceremonia en la que estudiantes y maestros la saludan y entonan el Himno Nacional. Respetar la bandera es una forma de expresar identidad, memoria y pertenencia a la nación.",
  "text_en": "In Mexico, February 24 is Flag Day, a date dedicated to one of the most beloved national symbols. The current flag is made up of three vertical stripes — green, white, and red — with the National Coat of Arms in the center of the white stripe. Green symbolizes hope, white unity, and red the blood of the national heroes. The coat of arms shows a golden eagle perched on a cactus devouring a snake, an image that represents the founding of Tenochtitlan. Along with the National Anthem and the Coat of Arms, the Flag is one of Mexico's three national symbols, and its use is regulated by law. In schools, flag ceremonies are held on Mondays, where students and teachers salute the flag and sing the National Anthem. Respecting the flag is a way to express identity, memory, and belonging to the nation.",
  "questions": [
    {"question": "¿En qué fecha se celebra el Día de la Bandera?",
     "options": ["24 de febrero","16 de septiembre","5 de mayo","20 de noviembre"],
     "correct": "24 de febrero",
     "question_en": "On what date is Flag Day celebrated?",
     "options_en": ["February 24","September 16","May 5","November 20"]},
    {"question": "¿Qué colores tiene la bandera de México?",
     "options": ["Verde, blanco y rojo","Azul, blanco y rojo","Verde, amarillo y rojo","Rojo y blanco"],
     "correct": "Verde, blanco y rojo",
     "question_en": "What colors does the Mexican flag have?",
     "options_en": ["Green, white and red","Blue, white and red","Green, yellow and red","Red and white"]},
    {"question": "¿Qué representa el águila del escudo nacional?",
     "options": ["La fundación de Tenochtitlan","La Independencia","La Revolución","La riqueza minera"],
     "correct": "La fundación de Tenochtitlan",
     "question_en": "What does the eagle in the coat of arms represent?",
     "options_en": ["The founding of Tenochtitlan","Independence","The Revolution","Mining wealth"]},
    {"question": "¿Qué simboliza el color verde de la bandera?",
     "options": ["La esperanza","La unidad","La sangre de los héroes","La paz eterna"],
     "correct": "La esperanza",
     "question_en": "What does the green color of the flag symbolize?",
     "options_en": ["Hope","Unity","The blood of the heroes","Eternal peace"]},
    {"question": "¿Cuántos son los símbolos patrios de México?",
     "options": ["Tres","Dos","Cuatro","Cinco"],
     "correct": "Tres",
     "question_en": "How many national symbols does Mexico have?",
     "options_en": ["Three","Two","Four","Five"]},
    {"question": "¿Qué se realiza en las escuelas los lunes?",
     "options": ["Honores a la bandera","Un examen","Una feria","Un desfile deportivo"],
     "correct": "Honores a la bandera",
     "question_en": "What is done in schools on Mondays?",
     "options_en": ["Flag honors ceremony","An exam","A fair","A sports parade"]},
  ],
}

out = [by_id[p["id"]] for p in rp]

for p in out:
    assert len(p["questions"]) == 6, p["id"]
    for q in p["questions"]:
        assert q["correct"] in q["options"], (p["id"], q["question"])
        assert "question_en" in q and "options_en" in q, (p["id"], q["question"])
    assert p.get("text_en"), p["id"]

json.dump(out, open("data/reading_passages.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("OK — 10 passages completed/accented, passage 16 replaced. Total:", len(out))
