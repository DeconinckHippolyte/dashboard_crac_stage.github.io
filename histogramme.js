////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////   Creation des graphiques ///////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////


//// Initalisation des variables globales ////

var myChart1;
var myChart2;
var myChart3;
var myChart4;
var filteredDataHom;

function initializeHistogramme(dataHom) {


    //// Préparation des données //// 
    //recuperation des filtres 
    var types = $(".select-multiple[name='type_hom[]']").val();
    var armes = $(".select-multiple[name='arme_procede[]']").val();
	var annees = $(".select-multiple[name='annee_comm[]']").val();
    var lieu = $(".select-multiple[name='type_lieu[]']").val();
	var competence = $(".select-multiple[name='zone_competence[]']").val();
    var sexe = $(".select-multiple[name='sexe_vict[]']").val();
	var mineur = $(".select-multiple[name='mineure_vict[]']").val();
    var interco = $(".select-multiple[name='interconnaissance[]']").val();
    var resolu = $(".select-multiple[name='resolution[]']").val();

    var departement = $(".select-multiple[name='dep_comm[]']").val();
    var dzpn = $(".select-multiple[name='dzpn_comm[]']").val();



    // filtrage dees données avec tous les filtres 
    var filteredDataHom = dataHom.features.filter(function(feature) {
        var typeValide = (types.length == 0 || types.includes(feature.properties.type_hom_detail));
        var armeValide = (armes.length == 0 || armes.includes(feature.properties.arme_procede_detail));
        var anneeValide = (annees.length == 0 || annees.includes(feature.properties.annee_comm));
        var lieuValide = (lieu.length == 0 || lieu.includes(feature.properties.type_lieu));
		var competenceValide = (competence.length == 0 || competence.includes(feature.properties.zone_competence_s));
        var sexeValide = (sexe.length == 0 || sexe.includes(feature.properties.sex_vict));
        var mineurValide = (mineur.length == 0 || mineur.includes(feature.properties.vict_mineure_majeure));
        var intercoValide = (interco.length == 0 || interco.includes(feature.properties.interconnaissance_vict_auteur));
        var resoluValide = (resolu.length == 0 || resolu.includes(feature.properties.elucidation));

        var departementValide = (typeof departement !== 'undefined' && (departement.length == 0 || departement.includes(feature.properties.insee_dep)));

        var dzpnValide = (typeof dzpn !== 'undefined' && (dzpn.length == 0 || dzpn.includes(feature.properties.dzpn)));
        


        return typeValide && armeValide && anneeValide && lieuValide && sexeValide && mineurValide && competenceValide && intercoValide && resoluValide && departementValide && dzpnValide;
    });

    // filtrage des données selon l'entité geograpgique d'appartenance
    var filteredDataHomAdmin = dataHom.features.filter(function(feature) {
        var departementValide = (typeof departement !== 'undefined' && (departement.length == 0 || departement.includes(feature.properties.insee_dep)));
        var dzpnValide = (typeof dzpn !== 'undefined' && (dzpn.length == 0 || dzpn.includes(feature.properties.dzpn)));
        
        return departementValide && dzpnValide;
    });

    // suppression des graphiques si existant 
    if (myChart1) {
        myChart1.destroy();
    }
    if (myChart2) {
        myChart2.destroy();
    }
    if (myChart3) {
        myChart3.destroy();
    }
    if (myChart4) {
        myChart4.destroy();
    }






    ///// Compatge des victimes (lignes) et representation de la donnée /////
    var totalVict = filteredDataHom.length;
    $('#nbreHom').html('<h2>' + totalVict + "</h2>");





    ///// creation de l'histogramme des modes operatoirs en 5 categories ////

        //initalisation des compteurs
        let sumArmeBlanche = 0;
        let sumArmeFeu = 0;
        let sumCoup = 0;
        let sumAutre = 0;
        let sumAutreProcede = 0;


        // Parcourir le tableau pour sommer les lignes
        filteredDataHom.forEach(function(feature) {
            switch (feature.properties.arme_procede) {
                case "Couteau":
                    sumArmeBlanche++;
                    break;
                case "Arme à feu":
                    sumArmeFeu++;
                    break;
                case "Coups et violence":
                    sumCoup++;
                    break;
                case "Autres procédés":
                    sumAutreProcede++;
                    break;
                case "Autre type d'arme":
                case "Non-renseigné":
                    sumAutre++;
                    break;
            }
        });



        // Creation du graphique
        var ctx = document.getElementById('hist3_canvas').getContext('2d');
        myChart1 = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Arme blanche', 'Arme à feu', "Autre type d'arme", 'Coups et violence', 'Autres procédés'],
                datasets: [{
                    data: [sumArmeBlanche, sumArmeFeu,sumAutre,sumCoup, sumAutreProcede],
                    backgroundColor: [
                        'rgba(200, 40, 101, 0.2)',
                    ],
                    borderColor: [
                        'rgba(200, 40, 101, 1)',
                    ],
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                responsive: true,
                maintainAspectRatio: false, 
                plugins: {
                    title: {
                        display: true,
                        text: 'Mode opératoire'
                    },
                    legend: {
                        display: false   // Cacher la légende
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                var value = context.parsed.y;
                                var total = context.dataset.data.reduce(function(a, b) { return a + b; }, 0);
                                var percentage = ((value/total)*100).toFixed(2)+"%";
                                return value + " (" + percentage + ")";
                            }
                        }
                    },
                    // creation des clic pour les definitions
                    datalabels: {
                        formatter: function(value, context) {
                            if (context.dataIndex === 2 || context.dataIndex === 4) {
                                return 'ⓘ';
                            }
                            return '';
                        },
                        listeners: {
                            click: function(context) {
                                let message = '';
                                switch (context.dataIndex) {
                                    case 2:
                                        message = " <strong>Autre type d'arme</strong> : L'homicide est commis avec une arme autre qu'une arme à feu ou un couteau, c'est à dire principalement à l'aide d'une arme par destination (ex. oreiller, voiture).";
                                        break;
                                    case 4:
                                        message = "<strong>Autres procédés</strong> : L'homicide est commis sans utilisation d'une arme. La victime est empoisonnée/intoxiquée, noyée, ou décède par délaissement ou privation de soins.                                    ";
                                        break;
                                }
                                showDef(message);
                            }
                        },
                        align: 'end',
                        anchor: 'end',
                        color: '#000',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });






        
    ///// creation de l'histogramme des type d'homicide en 4 categories ////

        //Initalisation des compteurs
        let sumActiviteIllegal = 0;
        let sumAltercation = 0;
        let sumFamilial= 0;
        let sumAutreType = 0;

        // Parcourir le tableau pour sommer les lignes
        filteredDataHom.forEach(function(feature) {
            switch (feature.properties.type_hom_5_cat) {
                case "Activité illégale":
                    sumActiviteIllegal++;
                    break;
                case "Altercation":
                    sumAltercation++;
                    break;
                case "Familial":
                    sumFamilial++;
                    break;
                case "Autre type d'homicide":
                case "Non caractérisable":
                    sumAutreType++;
                    break;
            }
        });

        // Creation du graphique
        var ctx = document.getElementById('hist2_canvas').getContext('2d');
        myChart2 = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Activité illegale', 'Altercation','Familial', 'Autre'],
                datasets: [{
                    data: [sumActiviteIllegal, sumAltercation,sumFamilial, sumAutreType],
                    backgroundColor: [
                        'rgba(97, 191, 188, 0.3)',
                    ],
                    borderColor: [
                        'rgba(97, 191, 188, 1)',
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, 
                plugins: {
                    title: {
                        display: true,
                        text: "Types d'homicide"
                    },
                    legend: {
                        display: false   // Cacher la légende
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                var value = context.parsed.y;
                                var total = context.dataset.data.reduce(function(a, b) { return a + b; }, 0);
                                var percentage = ((value/total)*100).toFixed(2)+"%";
                                return value + " (" + percentage + ")";
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });





    /////// Création du graphique d'évolution du nombre de victime pour les trois années ////


        // initalisation des compteurs
        let sum2019 = 0;
        let sum2020 = 0;
        let sum2021= 0;

        // Parcourir le tableau pour sommer les lignes
        filteredDataHom.forEach(function(feature) {
            switch (feature.properties.annee_comm) {
                case "2019":
                    sum2019++;
                    break;
                case "2020":
                    sum2020++;
                    break;
                case "2021":
                    sum2021++;
                    break;
            }
        });

        // Creation du graphique
        var ctx = document.getElementById('hist4_canvas').getContext('2d');
        myChart3 = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['2019', '2020','2021'],
                datasets: [{
                    data: [sum2019, sum2020,sum2021],
                    backgroundColor: [
                        'rgba(200, 40, 101, 0.2)',
                    ],
                    borderColor: [
                        'rgba(200, 40, 101, 1)',
                    ],
                    borderWidth: 1,
                    fill: false,
                    showLine: true,      
                    fill: false,          
                    pointRadius: function(context) {
                        var value = context.dataset.data[context.dataIndex];
                        return value === 0 ? 0 : 7;
                    },       
                    tension: 0.4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, 
                plugins: {
                    title: {
                        display: true,
                        text: "Évolution"
                    },
                    legend: {
                        display: false   // Cacher la légende
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                var value = context.parsed.y;
                                var total = context.dataset.data.reduce(function(a, b) { return a + b; }, 0);
                                var percentage = ((value/total)*100).toFixed(2)+"%";
                                return value + " (" + percentage + ")";
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });







    ////// creation graphique jauge pourcentage de victime ////

        // nombre de victimes filrée par entitée administrative
        var totalVictAdmin = filteredDataHomAdmin.length;

        //Calcul des pourcentages de victimes filtrée au sein des entitées geographique 
        var pourcentVict = filteredDataHom.length/totalVictAdmin*100;
        var restPourcentVict = 100 - pourcentVict;

        
        ////Creation du label de la jauge (ou liste des departements/dzpn)
            // Récupération de tous les textes des options sélectionnées pour departement et dzpn
            function truncateList(list, maxElements) {
                if (list.length > maxElements) {
                    return list.slice(0, maxElements).concat("...");
                } else {
                    return list;
                }
            }
            
            // Récupération de tous les textes des options sélectionnées pour departement et dzpn
            var departements = $(".select-multiple[name='dep_comm[]'] option:selected").map(function() {
                return $(this).text().substring(5);
            }).get();
            
            var dzpns = $(".select-multiple[name='dzpn_comm[]'] option:selected").map(function() {
                return $(this).text();
            }).get();
            
            // Troncation des listes après 5 éléments
            departements = truncateList(departements, 5);
            dzpns = truncateList(dzpns, 5);
            
            // Création de la chaîne de texte pour les départements et dzpn
            var departementText = departements.join(', ');
            var dzpnText = dzpns.join(', ');
            
            var label;
            if (departementText.length > 2) {
                label = " % des victimes en " + departementText; 
            } else if (dzpnText.length > 2) {
                label = " % des victimes pour la " + dzpnText;
            } else {
                label = " % des victimes  en France";
            }



            
    // création du graphique
        var ctx = document.getElementById('hist5_canvas').getContext('2d');

        myChart4 = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pourcentage de victime', 'Total'],
                datasets: [{
                    data: [pourcentVict, restPourcentVict],
                    backgroundColor: ['rgba(0, 32, 96, 1)', 'rgba(0, 32, 96, 0.4)'],
                    borderRadius: 10,  
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, 
                rotation: -90,
                circumference: 180,
                cutout: '75%',  // Rendre le doughnut plus fin. Ajustez cette valeur selon vos besoins.
                plugins: {
                    legend: {
                        display: false   // Cacher la légende
                    },
                    datalabels: {
                        formatter: (value) => {
                        return value + '%';
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                var value = context.parsed.toFixed(2); // Format avec deux chiffres après la virgule
                                var labelText = context.dataIndex === 0 ? value + " " + label : value;
                    
                                var maxLengthPerLine = 30; // Changez cette valeur selon vos besoins
                                var words = labelText.split(" "); // Divisez la chaîne en mots
                                var lines = [];
                                var currentLine = words[0];
                    
                                for (var i = 1; i < words.length; i++) {
                                    if (currentLine.length + words[i].length < maxLengthPerLine) {
                                        currentLine += " " + words[i]; // Ajoutez le mot à la ligne actuelle
                                    } else {
                                        lines.push(currentLine); // Sauvegardez la ligne actuelle
                                        currentLine = words[i]; // Commencez une nouvelle ligne avec le mot actuel
                                    }
                                }
                                lines.push(currentLine); // Ajoutez la dernière ligne
                    
                                return lines;
                            }
                        }
                    }
                },
            }
        });


}