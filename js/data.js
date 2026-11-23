/* Données du plan : ingrédients, 35 recettes du coach + 7 collations, étapes de cuisine, rotation sur 4 semaines. */
"use strict";
/* ---------- Données : ingrédients (rayon, unité, achat, prix estimé) ---------- */
const AISLES = {
  fruits:"Fruits & légumes", viande:"Boucherie & volaille", poisson:"Poissonnerie", cremerie:"Crèmerie, œufs & frais",
  pain:"Pain", salee:"Épicerie salée", sucree:"Petit-déj & épicerie sucrée", surgeles:"Surgelés"
};
// [nom, rayon, unité, achat, placard?]  achat = {s:taille, l:libellé, p:prix} ou {pw:poids pièce, w:[sing,plur], p:prix pièce}
const ING = {
  poulet:["Blanc de poulet","viande","g",[{s:500,l:"barquette 500 g",p:6.5},{s:1000,l:"barquette 1 kg",p:11.5}]],
  boeuf:["Bœuf haché 5 % MG","viande","g",[{s:500,l:"barquette 500 g",p:7},{s:1000,l:"barquette 1 kg",p:12.9}]],
  steak:["Steak de bœuf à griller","viande","g",{s:300,l:"lot de 2 (300 g)",p:7.5}],
  dinde:["Escalopes de dinde","viande","g",{s:500,l:"barquette 500 g",p:6.5}],
  porc:["Filet mignon de porc","viande","g",{s:450,l:"filet (~450 g)",p:7.5}],
  jambon:["Jambon blanc","viande","g",{s:160,l:"4 tranches (160 g)",p:2.6}],
  saumon:["Pavés de saumon (frais ou surgelés)","poisson","g",{s:500,l:"4 pavés (500 g)",p:10}],
  saumonfume:["Saumon fumé","poisson","g",{s:120,l:"4 tranches (120 g)",p:4.5}],
  oeuf:["Œufs","cremerie","pc",{s:12,l:"boîte de 12",p:3.6}],
  lait:["Lait demi-écrémé","cremerie","ml",{s:1000,l:"brique 1 L",p:1.05}],
  skyr:["Skyr nature","cremerie","g",{s:450,l:"pot 450 g",p:1.9}],
  fromageblanc:["Fromage blanc 3 %","cremerie","g",{s:500,l:"pot 500 g",p:1.4}],
  fromagefrais:["Fromage frais nature","cremerie","g",{s:150,l:"barquette 150 g",p:1.9}],
  cottage:["Cottage cheese","cremerie","g",{s:200,l:"pot 200 g",p:1.8}],
  yaourt:["Yaourts nature","cremerie","g",{s:500,l:"pack 4 × 125 g",p:1}],
  parmesan:["Parmesan râpé","cremerie","g",{s:100,l:"sachet 100 g",p:2.6}],
  emmental:["Emmental en tranches","cremerie","g",{s:200,l:"paquet 200 g",p:2.2}],
  cheddar:["Cheddar en tranches","cremerie","g",{s:200,l:"paquet 200 g",p:2.3}],
  beurre:["Beurre doux","cremerie","g",{s:250,l:"plaquette 250 g",p:2.6},1],
  houmous:["Houmous","cremerie","g",{s:200,l:"pot 200 g",p:2}],
  painc:["Pain complet tranché","pain","g",{s:500,l:"paquet 500 g",p:2.3}],
  painburger:["Pains à burger","pain","g",{s:320,l:"paquet de 4",p:1.9}],
  tortilla:["Tortillas de blé","pain","g",{s:370,l:"paquet de 6",p:1.9}],
  riz:["Riz basmati","salee","g",{s:1000,l:"paquet 1 kg",p:2.6},1],
  pates:["Pâtes complètes","salee","g",{s:500,l:"paquet 500 g",p:1.3}],
  spaghetti:["Spaghetti","salee","g",{s:500,l:"paquet 500 g",p:1.1}],
  semoule:["Semoule moyenne","salee","g",{s:1000,l:"paquet 1 kg",p:1.9},1],
  quinoa:["Quinoa","salee","g",{s:500,l:"paquet 500 g",p:3.4}],
  pchiche:["Pois chiches","salee","g",{s:265,l:"boîte (265 g égouttés)",p:1}],
  hrouge:["Haricots rouges","salee","g",{s:250,l:"boîte (250 g égouttés)",p:1}],
  mais:["Maïs doux","salee","g",{s:285,l:"boîte (285 g égouttés)",p:1.2}],
  thon:["Thon au naturel","salee","g",{s:140,l:"boîte (140 g égouttés)",p:1.9}],
  coulis:["Coulis de tomate","salee","g",{s:500,l:"brique 500 g",p:1}],
  concassees:["Tomates concassées","salee","g",{s:400,l:"boîte 400 g",p:0.9}],
  laitcoco:["Lait de coco","salee","ml",{s:400,l:"boîte 400 ml",p:1.6}],
  pesto:["Pesto","salee","g",{s:190,l:"pot 190 g",p:2.3}],
  crackers:["Crackers complets","salee","g",{s:200,l:"paquet 200 g",p:1.9}],
  galettes:["Galettes de riz","salee","pc",{s:16,l:"paquet de 16",p:1.3}],
  huile:["Huile d'olive","salee","ml",{s:1000,l:"bouteille 1 L",p:9},1],
  avoine:["Flocons d'avoine","sucree","g",{s:1000,l:"paquet 1 kg",p:1.8},1],
  granola:["Granola","sucree","g",{s:500,l:"paquet 500 g",p:3}],
  bc:["Beurre de cacahuète","sucree","g",{s:350,l:"pot 350 g",p:3.2},1],
  miel:["Miel","sucree","g",{s:500,l:"pot 500 g",p:5},1],
  cacao:["Cacao non sucré","sucree","g",{s:250,l:"boîte 250 g",p:3.2},1],
  choco:["Chocolat noir 70 %","sucree","g",{s:100,l:"tablette 100 g",p:1.4}],
  amandes:["Amandes","sucree","g",{s:200,l:"sachet 200 g",p:3.2}],
  noix:["Cerneaux de noix","sucree","g",{s:200,l:"sachet 200 g",p:3.6}],
  ananas:["Ananas au jus","sucree","g",{s:340,l:"boîte (340 g égouttés)",p:1.8}],
  banane:["Bananes","fruits","g",{pw:120,w:["banane","bananes"],p:0.25}],
  pomme:["Pommes","fruits","g",{pw:150,w:["pomme","pommes"],p:0.35}],
  orange:["Oranges","fruits","g",{pw:130,w:["orange","oranges"],p:0.35}],
  kiwi:["Kiwis","fruits","g",{pw:80,w:["kiwi","kiwis"],p:0.35}],
  avocat:["Avocats","fruits","g",{pw:140,w:["avocat","avocats"],p:1}],
  brocoli:["Brocolis","fruits","g",{pw:400,w:["tête de brocoli","têtes de brocoli"],p:1.8}],
  courgette:["Courgettes","fruits","g",{pw:250,w:["courgette","courgettes"],p:0.6}],
  carotte:["Carottes","fruits","g",{s:1000,l:"sachet 1 kg",p:1.4}],
  pdt:["Pommes de terre","fruits","g",{s:2500,l:"filet 2,5 kg",p:3.3}],
  patate:["Patates douces","fruits","g",{pw:400,w:["patate douce","patates douces"],p:1.1}],
  concombre:["Concombres","fruits","g",{pw:300,w:["concombre","concombres"],p:0.9}],
  tomate:["Tomates","fruits","g",{pw:120,w:["tomate","tomates"],p:0.35}],
  tomcerise:["Tomates cerises","fruits","g",{s:250,l:"barquette 250 g",p:2.1}],
  salade:["Salade verte","fruits","g",{s:200,l:"sachet 200 g",p:1.6}],
  hverts:["Haricots verts extra-fins","surgeles","g",{s:1000,l:"sachet 1 kg",p:2.4}],
  fruitsrouges:["Fruits rouges","surgeles","g",{s:500,l:"sachet 500 g",p:3.2}],
};
const SHORT = {poulet:"Poulet",boeuf:"Bœuf haché 5 %",steak:"Steak de bœuf",dinde:"Escalope de dinde",porc:"Filet mignon de porc",jambon:"Jambon blanc",
  saumon:"Saumon",saumonfume:"Saumon fumé",oeuf:"Œuf",lait:"Lait demi-écrémé",skyr:"Skyr",fromageblanc:"Fromage blanc 3 %",fromagefrais:"Fromage frais",
  cottage:"Cottage cheese",yaourt:"Yaourt nature",parmesan:"Parmesan",emmental:"Emmental",cheddar:"Cheddar",beurre:"Beurre",houmous:"Houmous",
  painc:"Pain complet",painburger:"Pain burger",tortilla:"Tortillas de blé",riz:"Riz basmati (cru)",pates:"Pâtes complètes (crues)",spaghetti:"Spaghetti (crus)",
  semoule:"Semoule (crue)",quinoa:"Quinoa (cru)",pchiche:"Pois chiches cuits",hrouge:"Haricots rouges cuits",mais:"Maïs",thon:"Thon au naturel égoutté",
  coulis:"Coulis de tomate",concassees:"Tomates concassées",laitcoco:"Lait de coco",pesto:"Pesto",crackers:"Crackers complets",galettes:"Galettes de riz",
  huile:"Huile d'olive",avoine:"Flocons d'avoine",granola:"Granola",bc:"Beurre de cacahuète",miel:"Miel",cacao:"Cacao non sucré",choco:"Chocolat noir",
  amandes:"Amandes",noix:"Noix",ananas:"Ananas",banane:"Banane",pomme:"Pomme",orange:"Orange",kiwi:"Kiwi",avocat:"Avocat",brocoli:"Brocolis",
  courgette:"Courgette",carotte:"Carotte",pdt:"Pommes de terre",patate:"Patate douce",concombre:"Concombre",tomate:"Tomate",tomcerise:"Tomates cerises",
  salade:"Salade verte",hverts:"Haricots verts",fruitsrouges:"Fruits rouges"};

/* ---------- Les 35 recettes du plan (+ 7 collations), quantités du PDF ---------- */
const CAT = {B:{n:"Petit-déjeuner",k:500},C:{n:"Collation",k:250},L:{n:"Déjeuner",k:700},D:{n:"Dîner",k:850}};
const R = {
 B1:{c:"B",n:"Porridge banane et beurre de cacahuète",i:{avoine:45,lait:150,skyr:150,banane:100,bc:8},h:"La veille : mélange les flocons et le lait dans un bocal, au frigo. Le matin : ajoute le skyr, la banane en rondelles et le beurre de cacahuète. Se transporte bien les jours de garde."},
 B2:{c:"B",n:"Tartines œufs et avocat",i:{painc:90,oeuf:2,avocat:40,skyr:100},h:"Fais griller le pain, cuis les œufs (au plat, brouillés, ou durs préparés en session). Écrase l'avocat sur le pain. Le skyr se mange à côté."},
 B3:{c:"B",n:"Bowl fromage blanc et granola",i:{fromageblanc:200,granola:65,fruitsrouges:100,miel:10},h:"Tout dans un bol. Sors les fruits rouges du congélateur la veille au soir."},
 B4:{c:"B",n:"Pancakes protéinés",i:{avoine:50,oeuf:1,banane:100,skyr:150,miel:5},h:"Mixe les flocons, l'œuf et la banane. Cuis 3 ou 4 petits pancakes dans une poêle antiadhésive (2 min par face). Sers avec le skyr et le miel. Se prépare la veille."},
 B5:{c:"B",n:"Sandwich jambon et fromage",i:{painc:100,jambon:60,emmental:20,beurre:5,orange:100},h:"Beurre le pain, ajoute jambon et emmental. L'orange se mange à côté. Parfait à emporter."},
 B6:{c:"B",n:"Smoothie énergétique",i:{lait:250,banane:100,avoine:40,bc:10,skyr:100},h:"Tout au blender pendant 30 secondes. Se boit sur la route dans une gourde."},
 B7:{c:"B",n:"Tartines saumon et fromage frais",i:{painc:90,saumonfume:60,fromagefrais:30,skyr:100,kiwi:80},h:"Tartine le fromage frais sur le pain, ajoute le saumon fumé. Skyr et kiwi à côté."},
 C1:{c:"C",n:"Skyr, banane et amandes",i:{skyr:150,banane:100,amandes:15}},
 C2:{c:"C",n:"Tartines beurre de cacahuète",i:{painc:60,bc:15,lait:100}},
 C3:{c:"C",n:"Fromage blanc, noix et fruits rouges",i:{fromageblanc:200,noix:15,fruitsrouges:80}},
 C4:{c:"C",n:"Smoothie banane et lait",i:{lait:250,banane:100,avoine:15},h:"Tout au blender."},
 C5:{c:"C",n:"Œufs et pain complet",i:{oeuf:2,painc:35},h:"Œufs durs cuits en session (10 min dans l'eau bouillante), ils se gardent 4 jours au frigo dans leur coquille."},
 C6:{c:"C",n:"Yaourt protéiné et granola",i:{skyr:150,granola:35,pomme:80}},
 C7:{c:"C",n:"Mini-sandwich jambon",i:{painc:55,jambon:40,fromagefrais:15}},
 C8:{c:"C",n:"Skyr, miel et amandes",i:{skyr:170,miel:15,amandes:15}},
 C9:{c:"C",n:"Galettes de riz et beurre de cacahuète",i:{galettes:3,bc:20,banane:60},h:"Sans frigo : idéal pendant une garde."},
 C10:{c:"C",n:"Cottage cheese et ananas",i:{cottage:150,ananas:120,noix:10}},
 C11:{c:"C",n:"Boules énergétiques maison",i:{avoine:35,bc:15,miel:10,choco:10},h:"En session : mélange flocons, beurre de cacahuète, miel et chocolat haché. Forme 3 ou 4 boules, 30 min au frigo. Elles tiennent sans frigo pendant une garde."},
 C12:{c:"C",n:"Houmous et crackers",i:{houmous:50,crackers:35,concombre:100}},
 C13:{c:"C",n:"Smoothie cacao et banane",i:{lait:200,banane:80,skyr:100,cacao:5},h:"Tout au blender."},
 C14:{c:"C",n:"Pomme, amandes et chocolat noir",i:{pomme:150,amandes:20,choco:10},h:"Sans frigo : idéal pendant une garde."},
 L1:{c:"L",n:"Poulet, riz et brocolis",i:{poulet:150,riz:90,brocoli:150,huile:10},h:"Riz : 12 min dans l'eau bouillante. Poulet en dés à la poêle avec l'huile et tes épices (8-10 min). Brocolis : 6 min à l'eau ou à la vapeur, ils restent croquants au réchauffage."},
 L2:{c:"L",n:"Pâtes à la bolognaise",i:{pates:90,boeuf:150,coulis:150,parmesan:10,huile:5},h:"Fais revenir le bœuf dans l'huile, ajoute le coulis, herbes et ail, 10 min à feu doux. Pâtes al dente (elles finissent de cuire au réchauffage). Parmesan au moment de manger."},
 L3:{c:"L",n:"Saumon et pommes de terre",i:{saumon:150,pdt:250,hverts:150,huile:5},h:"Pommes de terre en quartiers au four à 200 °C, 35 min avec l'huile. Saumon au four 12-15 min (citron, aneth). Haricots verts 8 min à l'eau."},
 L4:{c:"L",n:"Wraps poulet et avocat",i:{tortilla:100,poulet:130,avocat:40,yaourt:50,tomate:50,concombre:50},h:"En session : cuis le poulet en lamelles. Le jour même : garnis les tortillas avec le poulet, l'avocat coupé au dernier moment, le yaourt et les crudités.",f:"Poulet cuit en session, wrap monté le jour même."},
 L5:{c:"L",n:"Dinde et couscous",i:{dinde:150,semoule:85,pchiche:50,courgette:100,carotte:50,huile:5},h:"Semoule : verse le même volume d'eau bouillante, couvre 5 min. Dinde en lanières à la poêle. Légumes en dés poêlés 10 min avec ras el hanout ou cumin. Ajoute les pois chiches."},
 L6:{c:"L",n:"Salade de riz au thon",i:{riz:85,thon:120,oeuf:1,mais:50,tomate:50,concombre:50,huile:8},h:"Riz cuit puis refroidi, œuf dur (10 min). Mélange avec le thon, le maïs, les crudités et l'huile. Se mange froid : parfait pendant une garde."},
 L7:{c:"L",n:"Steak et patate douce",i:{steak:150,patate:300,hverts:150,huile:5},h:"Patate douce en cubes au four à 200 °C, 30 min. Haricots verts 8 min. Steak : saisi 2 min par face (ou cuit le jour même si tu es chez toi)."},
 D1:{c:"D",n:"Spaghetti bolognaise",i:{spaghetti:110,boeuf:150,coulis:150,parmesan:15,huile:10,salade:100},h:"Même base que les pâtes bolognaise. La salade verte s'assaisonne au moment de manger."},
 D2:{c:"D",n:"Poulet curry et riz",i:{poulet:160,riz:100,laitcoco:100,courgette:150,huile:5},h:"Poulet en dés doré à la poêle, ajoute les courgettes en rondelles, 1 c. à café de curry et le lait de coco. 10 min à feu doux. Riz à côté."},
 D3:{c:"D",n:"Saumon, quinoa et légumes",i:{saumon:170,quinoa:100,courgette:100,carotte:100,huile:10},h:"Quinoa rincé, 12 min à l'eau. Saumon au four 12-15 min. Courgettes et carottes en dés rôties au four 25 min avec l'huile."},
 D4:{c:"D",n:"Burger maison et pommes de terre",i:{painburger:80,boeuf:150,cheddar:20,pdt:250,huile:10,salade:40,tomate:60},h:"Frites maison au four à 210 °C, 30 min avec l'huile. Steak haché à la poêle 3 min par face, cheddar dessus. Monte le burger avec salade et tomate.",f:"Meilleur cuit le jour même : 30 min."},
 D5:{c:"D",n:"Porc, purée et légumes",i:{porc:170,pdt:350,lait:100,beurre:10,hverts:150,huile:5},h:"Pommes de terre à l'eau 20 min, écrase avec le lait chaud et le beurre. Filet mignon au four à 180 °C, 25 min (ou en médaillons à la poêle). Haricots verts 8 min."},
 D6:{c:"D",n:"Pâtes au poulet et pesto",i:{pates:110,poulet:150,pesto:25,parmesan:10,tomcerise:150},h:"Pâtes al dente. Poulet en dés à la poêle. Mélange avec le pesto et les tomates cerises coupées en deux. Parmesan au moment de manger."},
 D7:{c:"D",n:"Chili con carne et riz",i:{boeuf:150,riz:100,hrouge:100,concassees:150,mais:30,huile:5},h:"Fais revenir le bœuf, ajoute tomates concassées, cumin, paprika et un peu de piment. Ajoute haricots rouges et maïs, 15 min à feu doux. Riz à côté. Encore meilleur réchauffé."},
};

/* ---------- Étapes de cuisine des plats en boîte ----------
   Chaque étape : [phase, texte, minuteur en min] ou [clé] pour une étape commune (le riz de 3 recettes cuit en une fois).
   Phases : 1 mise en place · 2 four · 3 féculents · 4 découpe · 5 poêle · 6 légumes verts · 7 mise en boîtes · 8 rangement.
   {q:id} = quantité de l'ingrédient × portions, {b} = nombre de boîtes. */
const PHASES = {1:"Mise en place",2:"Au four",3:"Féculents et œufs",4:"Découpe",5:"À la poêle",6:"Légumes verts",7:"Mise en boîtes",8:"Rangement"};
const GROUPS = {
  riz:{ing:"riz",ph:3,min:12,t:"Riz : {q} dans une grande casserole d'eau bouillante salée, 12 min. Égoutte et étale-le pour qu'il refroidisse vite."},
  pates:{ing:"pates",ph:3,min:9,t:"Pâtes complètes : {q} dans l'eau bouillante salée, 2 min de moins que le paquet (elles finissent au réchauffage). Égoutte, un filet d'huile pour qu'elles ne collent pas."},
  spaghetti:{ing:"spaghetti",ph:3,min:8,t:"Spaghetti : {q} dans l'eau bouillante salée, 2 min de moins que le paquet. Égoutte, un filet d'huile."},
  semoule:{ing:"semoule",ph:3,min:5,t:"Semoule : {q} dans un saladier, verse le même volume d'eau bouillante salée, couvre 5 min puis égrène à la fourchette."},
  quinoa:{ing:"quinoa",ph:3,min:12,t:"Quinoa : rince {q} à l'eau froide, puis 12 min dans l'eau bouillante salée. Égoutte."},
  poulet:{ing:"poulet",ph:4,t:"Poulet : coupe {q} en dés."},
  hverts:{ing:"hverts",ph:6,min:8,t:"Haricots verts : {q} dans l'eau bouillante salée, 8 min. Égoutte."},
  brocoli:{ing:"brocoli",ph:6,min:6,t:"Brocolis : {q} en petits bouquets, 6 min dans l'eau bouillante salée, puis sous l'eau froide pour qu'ils restent verts et croquants."},
};
/* Étapes des petits-déjeuners et collations.
   veille = la veille au soir · jour = tout faire le jour même (1 portion)
   pre = à l'avance pendant une session « Je cuisine » (quantités pour toutes les portions)
   fin = ce qui reste à faire le jour même quand c'est préparé à l'avance.
   {q:id} quantité multipliée par le nombre de portions · {u:id} quantité pour 1 portion · {x:n} n × portions
   {pots} {sachets} {boites} nombre de contenants · vk : le rappel de la veille reste utile même si c'est préparé. */
const BC = {
 B1:{veille:["Dans un bocal, mélange {q:avoine} de flocons d'avoine et {q:lait} de lait. Ferme et mets au frigo pour la nuit."],
   jour:["Remue le porridge (un trait de lait s'il est trop épais).","Ajoute {q:skyr} de skyr et {q:banane} de banane en rondelles.","Termine avec {q:bc} de beurre de cacahuète. Froid tel quel, ou 1 min 30 au micro-ondes avant d'ajouter le skyr."],
   pre:["Prépare {pots} (bocal ou boîte) : dans chacun {u:avoine} de flocons et {u:lait} de lait. Couvercle, au frigo (3 jours)."],
   fin:["Sors ton bocal et remue (un trait de lait s'il est trop épais).","Ajoute {q:skyr} de skyr, {q:banane} de banane en rondelles et {q:bc} de beurre de cacahuète."]},
 B2:{jour:["Fais griller {q:painc} de pain complet (2 ou 3 tranches).","Cuis {q:oeuf} au plat ou brouillés, poêle antiadhésive, 3 à 4 min. Sel, poivre.","Écrase {q:avocat} d'avocat à la fourchette (sel, citron si tu en as) et étale-le sur le pain.","Pose les œufs dessus. {q:skyr} de skyr à côté."],
   pre:["Œufs durs : {q:oeuf} dans l'eau bouillante 10 min, puis dans l'eau froide. Au frigo dans leur coquille (4 jours), {u:oeuf} par matin."],
   fin:["Fais griller {q:painc} de pain complet.","Écale tes {q:oeuf} durs et coupe-les en rondelles.","Ouvre l'avocat le jour même : écrase {q:avocat} sur le pain, ajoute les œufs. {q:skyr} de skyr à côté."]},
 B3:{vk:1,veille:["Passe {q:fruitsrouges} de fruits rouges du congélateur au frigo."],
   jour:["Verse {q:fromageblanc} de fromage blanc dans un bol.","Ajoute les fruits rouges ({q:fruitsrouges}) et {q:miel} de miel.","Mets {q:granola} de granola au dernier moment pour qu'il reste croquant."],
   pre:["Prépare {pots} : dans chacun {u:fromageblanc} de fromage blanc et {u:miel} de miel. Au frigo (3 jours).","Prépare {sachets} de {u:granola} de granola, à part pour qu'il reste croquant. Les fruits rouges restent au congélateur."],
   fin:["Ajoute les fruits rouges décongelés ({q:fruitsrouges}) dans ton pot.","Verse le sachet de granola juste avant de manger."]},
 B4:{jour:["Mixe {q:avoine} de flocons, {q:oeuf} et {q:banane} de banane jusqu'à une pâte lisse (ou écrase la banane et mélange à la fourchette).","Poêle antiadhésive à feu moyen, à peine huilée : verse 3 ou 4 petites louches de pâte.","Cuis 2 min, retourne quand des bulles apparaissent, encore 2 min.","Sers avec {q:skyr} de skyr et {q:miel} de miel."],
   pre:["Mixe {q:avoine} de flocons, {q:oeuf} et {q:banane} de banane jusqu'à une pâte lisse.","Poêle antiadhésive à feu moyen, à peine huilée : cuis {x:4} petits pancakes, 2 min par face.","Laisse refroidir et range-les dans {boites}, 4 par boîte, au frigo (3 jours). Skyr et miel restent à part."],
   fin:["Réchauffe tes pancakes 30 s au micro-ondes (ou 1 min à la poêle), ou mange-les froids.","Sers avec {q:skyr} de skyr et {q:miel} de miel."]},
 B5:{jour:["Coupe {q:painc} de pain complet et beurre-le avec {q:beurre} de beurre.","Ajoute {q:jambon} de jambon et {q:emmental} d'emmental, referme.","L'orange ({q:orange}) se mange à côté. À emporter : emballe le sandwich dans du papier alu."],
   pre:["Sandwichs (2 jours d'avance au plus, le pain rassit) : chacun avec {u:painc} de pain complet, {u:beurre} de beurre, {u:jambon} de jambon et {u:emmental} d'emmental. Emballe-les et mets-les au frigo."],
   fin:["Prends ton sandwich au frigo et une orange ({q:orange})."]},
 B6:{jour:["Dans le blender : {q:lait} de lait, {q:banane} de banane en morceaux, {q:avoine} de flocons, {q:bc} de beurre de cacahuète et {q:skyr} de skyr.","Mixe 30 à 45 secondes, jusqu'à ce que ce soit lisse.","Verse dans une gourde ou un grand verre."],
   pre:["Prépare {pots} : dans chacun {u:avoine} de flocons et {u:bc} de beurre de cacahuète.","Option : coupe {q:banane} de banane en rondelles et congèle-la en {sachets} de {u:banane}, le smoothie sera plus frais."],
   fin:["Dans le blender : ton pot flocons-beurre de cacahuète, {q:lait} de lait, {q:skyr} de skyr et la banane ({q:banane}).","Mixe 30 à 45 secondes et verse dans une gourde."]},
 B7:{jour:["Fais griller {q:painc} de pain complet si tu aimes.","Tartine {q:fromagefrais} de fromage frais.","Ajoute {q:saumonfume} de saumon fumé, poivre, un filet de citron si tu en as.","À côté : {q:skyr} de skyr et {q:kiwi} de kiwi (coupé en deux, à la cuillère)."],
   pre:["Prépare {pots} de {u:skyr} de skyr. Les tartines se font le matin, en 3 minutes."],
   fin:["Tartine {q:fromagefrais} de fromage frais sur {q:painc} de pain complet, ajoute {q:saumonfume} de saumon fumé et du poivre.","Ton pot de skyr et un kiwi ({q:kiwi}) à côté."]},
 C1:{jour:["Verse {q:skyr} de skyr dans un bol ou un pot.","Ajoute {q:banane} de banane en rondelles et {q:amandes} d'amandes."],
   pre:["Prépare {pots} de {u:skyr} de skyr et {sachets} de {u:amandes} d'amandes. La banane se coupe au moment, sinon elle noircit."],
   fin:["Coupe la banane ({q:banane}) dans ton pot de skyr et ajoute le sachet d'amandes."]},
 C2:{jour:["Fais griller {q:painc} de pain complet.","Étale {q:bc} de beurre de cacahuète.","Bois {q:lait} de lait à côté."],
   pre:["Prépare {sachets} de {u:painc} de pain complet et {pots} de {u:bc} de beurre de cacahuète."],
   fin:["Étale le beurre de cacahuète sur le pain (grillé si tu peux).","Bois {q:lait} de lait à côté."]},
 C3:{vk:1,veille:["Passe {q:fruitsrouges} de fruits rouges du congélateur au frigo."],
   jour:["Verse {q:fromageblanc} de fromage blanc dans un bol.","Ajoute les fruits rouges ({q:fruitsrouges}) et {q:noix} de noix concassées."],
   pre:["Prépare {pots} de {u:fromageblanc} de fromage blanc et {sachets} de {u:noix} de noix. Les fruits rouges restent au congélateur."],
   fin:["Ajoute les fruits rouges décongelés ({q:fruitsrouges}) et le sachet de noix dans ton pot."]},
 C4:{jour:["Dans le blender : {q:lait} de lait, {q:banane} de banane en morceaux et {q:avoine} de flocons d'avoine.","Mixe 30 secondes et bois aussitôt."],
   pre:["Prépare {sachets} de {u:avoine} de flocons.","Option : congèle {q:banane} de banane en rondelles, en {sachets} de {u:banane}, pour un smoothie bien frais."],
   fin:["Dans le blender : un sachet de flocons, {q:lait} de lait et la banane ({q:banane}).","Mixe 30 secondes et bois aussitôt."]},
 C5:{jour:["Plonge {q:oeuf} dans l'eau bouillante, 10 min.","Refroidis-les dans l'eau froide, puis écale-les.","Mange-les avec {q:painc} de pain complet, sel et poivre."],
   fin:["Prends {q:oeuf} durs cuits en session (au frigo) et écale-les.","Mange-les avec {q:painc} de pain complet, sel et poivre."]},
 C6:{jour:["Verse {q:skyr} de skyr dans un bol.","Ajoute {q:pomme} de pomme en dés.","Verse {q:granola} de granola au dernier moment."],
   pre:["Prépare {pots} de {u:skyr} de skyr et {sachets} de {u:granola} de granola. La pomme se coupe au moment."],
   fin:["Coupe la pomme ({q:pomme}) en dés dans ton pot de skyr.","Verse le sachet de granola juste avant de manger."]},
 C7:{jour:["Tartine {q:fromagefrais} de fromage frais sur {q:painc} de pain complet.","Ajoute {q:jambon} de jambon et referme."],
   pre:["Mini-sandwichs (2 jours d'avance au plus) : chacun avec {u:painc} de pain complet, {u:fromagefrais} de fromage frais et {u:jambon} de jambon. Emballe-les, au frigo."],
   fin:["Sors ton mini-sandwich du frigo : prêt à manger."]},
 C8:{jour:["Verse {q:skyr} de skyr dans un bol.","Ajoute {q:miel} de miel et {q:amandes} d'amandes."],
   pre:["Prépare {pots} : dans chacun {u:skyr} de skyr et {u:miel} de miel, au frigo (3 jours). Les amandes ({u:amandes} par pot) en sachets à part, pour rester croquantes."],
   fin:["Verse le sachet d'amandes dans ton pot de skyr au miel."]},
 C9:{jour:["Étale {q:bc} de beurre de cacahuète sur {q:galettes} de riz.","Ajoute {q:banane} de banane en rondelles. Tout tient sans frigo."],
   pre:["Prépare {sachets} de {u:galettes} de riz et {pots} de {u:bc} de beurre de cacahuète. Pas besoin de frigo. La banane se prend entière."],
   fin:["Étale le beurre de cacahuète sur les galettes.","Ajoute la banane ({q:banane}) en rondelles."]},
 C10:{jour:["Verse {q:cottage} de cottage cheese dans un bol.","Ajoute {q:ananas} d'ananas en dés et {q:noix} de noix concassées."],
   pre:["Prépare {pots} : dans chacun {u:cottage} de cottage cheese et {u:ananas} d'ananas en dés, au frigo (3 jours). Les noix ({u:noix} par pot) en sachets à part."],
   fin:["Verse le sachet de noix dans ton pot cottage-ananas."]},
 C11:{jour:["Mélange {q:avoine} de flocons, {q:bc} de beurre de cacahuète, {q:miel} de miel et {q:choco} de chocolat noir haché.","Forme 3 ou 4 boules avec les mains (mouille-les si ça colle).","30 min au frigo pour qu'elles durcissent."],
   fin:["Prends 3 ou 4 boules énergétiques faites en session. Elles tiennent sans frigo."]},
 C12:{jour:["Coupe {q:concombre} de concombre en bâtonnets.","Trempe-les dans {q:houmous} de houmous, avec {q:crackers} de crackers."],
   pre:["Coupe {q:concombre} de concombre en bâtonnets. Répartis-les dans {pots} avec {u:houmous} de houmous au fond, au frigo (3 jours). Les crackers ({u:crackers} par pot) en sachets à part."],
   fin:["Sors ton pot houmous-concombre et ton sachet de crackers."]},
 C13:{jour:["Dans le blender : {q:lait} de lait, {q:banane} de banane, {q:skyr} de skyr et {q:cacao} de cacao non sucré.","Mixe 30 secondes et bois aussitôt."],
   pre:["Congèle {q:banane} de banane en rondelles, en {sachets} de {u:banane} : le smoothie sera plus frais. Le reste se fait au moment."]},
 C14:{jour:["Lave la pomme ({q:pomme}) et coupe-la en quartiers si tu veux.","Mange-la avec {q:amandes} d'amandes et {q:choco} de chocolat noir. Tout tient sans frigo."],
   pre:["Prépare {sachets} : dans chacun {u:amandes} d'amandes et {u:choco} de chocolat noir. Pas besoin de frigo. Les pommes se prennent entières."],
   fin:["Prends une pomme ({q:pomme}) et ton sachet amandes-chocolat."]},
};
const STEPS = {
  L1:[["poulet"],[5,"Poulet-brocolis : poêle bien chaude avec {q:huile} d'huile, dore le poulet 8 à 10 min avec tes épices (paprika, herbes, sel, poivre).",9],["riz"],["brocoli"],[7,"Poulet, riz et brocolis : répartis dans {b}."]],
  L2:[["pates"],[5,"Bolognaise : fais revenir {q:boeuf} de bœuf haché dans {q:huile} d'huile 5 min. Ajoute {q:coulis} de coulis de tomate, ail, herbes de Provence, sel et poivre. Mijote 10 min à feu doux.",15],[7,"Pâtes bolognaise : répartis dans {b}. Le parmesan ({q:parmesan}) se met au moment de manger."]],
  L3:[[2,"Pommes de terre : coupe {q:pdt} en quartiers, mélange avec {q:huile} d'huile, sel et paprika. Au four 35 min.",35],[5,"Saumon : pose {q:saumon} sur une plaque (citron, aneth, sel) et enfourne-le pour les 15 dernières minutes des pommes de terre.",15],["hverts"],[7,"Saumon et pommes de terre : répartis dans {b} avec les haricots verts."]],
  L4:[[4,"Wraps : coupe {q:poulet} de poulet en lamelles."],[5,"Wraps : poêle chaude, dore les lamelles 8 min avec paprika et cumin. Laisse refroidir.",8],[7,"Wraps : mets le poulet dans {b}. Tortillas, avocat, yaourt et crudités se montent le jour même."]],
  L5:[[4,"Dinde-couscous : coupe {q:dinde} de dinde en lanières, {q:courgette} de courgette et {q:carotte} de carotte en dés."],[5,"Dinde-couscous : dore la dinde 6 à 8 min et réserve-la. Même poêle avec {q:huile} d'huile : légumes 10 min avec ras el hanout ou cumin. Ajoute {q:pchiche} de pois chiches égouttés et la dinde.",18],["semoule"],[7,"Dinde et couscous : répartis dans {b}."]],
  L6:[["riz"],[4,"Salade de riz : coupe {q:tomate} de tomate et {q:concombre} de concombre en dés, égoutte {q:thon} de thon et {q:mais} de maïs."],[7,"Salade de riz : quand le riz est froid, mélange-le avec le thon, le maïs, les crudités et {q:huile} d'huile. Ajoute 1 œuf dur écalé par boîte. Répartis dans {b}."]],
  L7:[[2,"Patate douce : coupe {q:patate} en cubes, mélange avec {q:huile} d'huile et du sel. Au four 30 min.",30],["hverts"],[5,"Steaks : saisis {q:steak} de steak 2 min par face. Si tu es chez toi le jour même, cuis-les plutôt au moment de manger.",4],[7,"Steak et patate douce : répartis dans {b}."]],
  D1:[["spaghetti"],[5,"Bolognaise des spaghetti : fais revenir {q:boeuf} de bœuf haché dans {q:huile} d'huile 5 min, ajoute {q:coulis} de coulis, ail et herbes. Mijote 10 min.",15],[7,"Spaghetti bolognaise : répartis dans {b}. Salade ({q:salade}) et parmesan ({q:parmesan}) au moment de manger."]],
  D2:[["poulet"],[4,"Curry : coupe {q:courgette} de courgette en rondelles."],["riz"],[5,"Curry : poêle avec {q:huile} d'huile, dore le poulet 5 min, ajoute les courgettes 3 min, puis 1 c. à café de curry par portion et {q:laitcoco} de lait de coco. Mijote 10 min à feu doux.",18],[7,"Poulet curry et riz : répartis dans {b}."]],
  D3:[[2,"Légumes rôtis : coupe {q:courgette} de courgette et {q:carotte} de carotte en dés, mélange avec {q:huile} d'huile. Au four 25 min.",25],["quinoa"],[5,"Saumon : {q:saumon} au four 12 à 15 min, à côté des légumes.",14],[7,"Saumon, quinoa et légumes : répartis dans {b}."]],
  D4:[[7,"Burger : rien à cuire aujourd'hui, il se fait le jour même en 30 min. Range {q:boeuf} de bœuf haché au frigo (au congélateur si c'est pour dans plus de 2 jours)."]],
  D5:[[2,"Porc : sale et poivre {q:porc} de filet mignon, un filet d'huile ({q:huile}), au four 25 min. Laisse reposer 5 min avant de trancher.",25],[3,"Purée : épluche et coupe {q:pdt} de pommes de terre, 20 min dans l'eau bouillante salée.",20],["hverts"],[7,"Porc-purée : écrase les pommes de terre avec {q:lait} de lait chaud et {q:beurre} de beurre. Tranche le porc. Répartis dans {b}."]],
  D6:[["pates"],["poulet"],[5,"Poulet pesto : poêle chaude, dore le poulet 8 à 10 min.",9],[7,"Pâtes pesto : mélange pâtes, poulet et {q:pesto} de pesto, ajoute {q:tomcerise} de tomates cerises coupées en deux. Répartis dans {b} ; parmesan au moment de manger."]],
  D7:[["riz"],[5,"Chili : fais revenir {q:boeuf} de bœuf haché dans {q:huile} d'huile 5 min. Ajoute {q:concassees} de tomates concassées, 1 c. à café de cumin et de paprika par portion, un peu de piment. Mijote 10 min, puis ajoute {q:hrouge} de haricots rouges et {q:mais} de maïs égouttés, encore 5 min.",20],[7,"Chili et riz : répartis dans {b}. Il est encore meilleur réchauffé."]],
};

/* ---------- Rotation sur 4 semaines ----------
   La semaine est coupée en 3 blocs : lun-mar (2 portions), mer-jeu (2 portions), ven-dim (3 portions).
   Chaque repas reste le même sur tout le bloc : moins de recettes, moins de paquets entamés, moins cher. */
const BRK = [["B1","B6","B1"],["B4","B1","B6"],["B3","B6","B1"],["B5","B1","B6"]];
const CMS = [["C1","C4","C1"],["C5","C1","C4"],["C2","C1","C4"],["C7","C1","C4"]];
const CAS = [["C8","C9","C11"],["C8","C9","C11"],["C14","C9","C13"],["C8","C11","C9"]];
const LUNCH = [["L1","L2","L6"],["L4","L1","L5"],["L7","L2","L6"],["L1","L5","L3"]];
const DINNER = [["D2","D7","D6"],["D2","D4","D1"],["D5","D7","D2"],["D7","D2","D4"]];
const SLOT_OF_DAY = [0,0,1,1,2,2,2];
const BLOCK_START = [0,2,4], BLOCK_LEN = [2,2,3];
const LONG = new Set(["riz","pates","spaghetti","semoule","quinoa","pchiche","hrouge","mais","thon","coulis","concassees","laitcoco","crackers","galettes","huile","avoine","granola","bc","miel","cacao","choco","amandes","noix","ananas","hverts","fruitsrouges","parmesan","pesto","beurre"]);
const DAYS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const MONTHS = ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
const TIMES = {
  J:["6 h 15 · avant de partir","10 h · sans frigo","12 h 30 · boîte au micro-ondes","16 h · sans frigo","19 h 45 · en rentrant"],
  G:["6 h 15 · avant de partir","10 h · sans frigo","12 h 30 · boîte au micro-ondes","16 h · sans frigo","20 h · boîte à la caserne"],
  N:["8 h 30","11 h","13 h","17 h 30 · avant de partir","21 h · boîte à la caserne"],
  A:["8 h","10 h 30","12 h 30","16 h 30","20 h"],
  rest:["8 h","10 h 30","12 h 30","16 h 30","20 h"]};
// Types de garde
const GT = {J:{n:"Jour 7 h – 19 h",s:"Jour"},N:{n:"Nuit 19 h – 7 h",s:"Nuit"},G:{n:"Garde 24 h",s:"24 h"},A:{n:"Astreinte",s:"Astr."}};
const GT_ORDER = ["J","N","G","A"];

/* Une image par plat */
const EMO = {B1:"🥣",B2:"🥑",B3:"🫐",B4:"🥞",B5:"🥪",B6:"🥤",B7:"🐟",C1:"🍌",C2:"🥜",C3:"🍓",C4:"🥛",C5:"🥚",C6:"🍏",C7:"🥪",C8:"🍯",C9:"🍘",C10:"🍍",
  C11:"🍫",C12:"🥒",C13:"🥤",C14:"🍎",L1:"🥦",L2:"🍝",L3:"🐟",L4:"🌯",L5:"🍲",L6:"🥗",L7:"🥩",D1:"🍝",D2:"🍛",D3:"🐟",D4:"🍔",D5:"🥔",D6:"🍝",D7:"🌶️"};
const AISLE_EMO = {fruits:"🥕",viande:"🥩",poisson:"🐟",cremerie:"🧀",pain:"🍞",salee:"🥫",sucree:"🍯",surgeles:"🧊"};
