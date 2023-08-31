////////////////////////////////////////////////////////////////////////////////////////////////////
//////////Creation de la carte leaflet, initalisation des couches et gestion des filtres///////////
//////////////////////////////////////////////////////////////////////////////////////////////////




//// Initalisation des variables globales ////
var homLayer;
var homLayerDep;
var zoomendActive = true;
var zoomAtStart;
var selectedDepartments = [];
var selectedDZPN = [];



//// Création de la carte leaflet, gestion de zoom et cahregrmement des données GeoJson pour lancer la creation des couches ////
function initialize() {

	//// creation de la caret leaflet
		// création de la carte et paramétrage général : centre et niveau de zoom
		var map = L.map('mapid').setView([46.8, 2.345818], 6);

		// création d'une couche "osm"
		var osmLayer = L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
		attribution: '© <a href="http://osm.org/copyright">OpenStreetMap</a> contributors | Données opérationnelles CRAC (données non-réelles)',
		maxZoom: 19,
		opacity: 0.7
		});		 
		map.addLayer(osmLayer);

	//// ajouter les fonctions de la carte stokée dans fonction_leaflet.js
		initializeFonctionLeaflet(map);


	//// gestion de l'affichages des couches en fonction du niveau de zoom (Option : apres clic sur un marker departement regroupé, meme si le niveau de zoom est inferieur à 11, on se revient pas sur la couyche des groupés, seuelement si zoom arriere )
		map.on('zoomstart', function() {
			zoomAtStart = map.getZoom(); // Stockez le niveau de zoom au démarrage du zoom
		});

		map.on('zoomend', function() {
			var currentZoom = map.getZoom(); // Niveau de zoom actuel
			if (currentZoom < zoomAtStart && !zoomendActive) {
				zoomendActive = true; // Si le niveau de zoom est inférieur au niveau de zoom au début du zoom, réactivez l'événement zoomend
			}
			if(zoomendActive) {
				if (currentZoom >= 11){
					if(!map.hasLayer(homLayer)) {
						map.addLayer(homLayer);
					}
					if(map.hasLayer(homLayerDep)) {
						map.removeLayer(homLayerDep);
					}
				} else {
					if(!map.hasLayer(homLayerDep)) {
						map.addLayer(homLayerDep);
					}
					if(map.hasLayer(homLayer)) {
						map.removeLayer(homLayer);
					}
				}
			}
		});
		
		// Écouteur d'événement pour le bouton de zoom arrière
		document.getElementsByClassName('leaflet-control-zoom-out')[0].addEventListener('click', function() {
			zoomendActive = true; // Réactiver l'événement 'zoomend' lorsque le bouton de zoom arrière est cliqué
		});


	//// Cahregmement des données lancer les données de creation des couches, histogramme..
		// Chargement des données JSON pour les départements et les homicides
		var homPromise = $.getJSON("homicide_2019_2021.geojson");
		var depPromise = $.getJSON("departement_homicide_2019_2021_s.geojson");
		var dzpnPromise = $.getJSON("dzpn_homicide_2019_2021_s.geojson");
		

		// On utilise Promise.all pour s'assurer que les deux requêtes sont terminées avant de les utiliser
		Promise.all([depPromise, homPromise, dzpnPromise]).then(function(values) {
			var dataDep = values[0];
			var dataHom = values[1];
			var dataDzpn = values[2];
			
			// Passer les données chargées aux fonctions appropriées
			initializefond(dataDep, dataDzpn, dataHom, map);
			initializeOptionPoint(dataHom, dataDep, map);
			initializeSelectDep(dataDep);
			initializeSelectDZPN(dataDzpn);
			
		});
}



//// Création des couches de fond de carte adminitsrative /////
function initializefond(dataDep, dataDzpn, dataHom, map){

	//// création d'une couche des départements ainsi que de ces options 
	// creation de la couche des département
		var depLayer = L.geoJson(dataDep, 
			{style: function(feature)
				{   
				// paramétrage de la symbologie de la couche "departement"
				return { color: "#8ea2c9", weight: 1, fillOpacity: 0.0 };
				},
			onEachFeature: function(feature, layer ){
				// ajout des événements mouseover et mouseout
				layer.on({
					mouseover: function(e) {
							e.target.setStyle({
								weight: 3
							});
							info.update(e.target.feature.properties); // Mise à jour du contenu de la div info
					},
					mouseout: function(e) {
						if (selectedDepartments.indexOf(e.target.feature.properties.insee_dep) === -1) {
							depLayer.resetStyle(e.target);
						}
						info.update(); // Réinitialisation du contenu de la div info
					}
				});
			}
		});
	



	// Création du gestionnaire d'événement pour un clic sur la couche 'depLayer' : permettant la selection simple ou multiple pour filtrer les données selon les départements
	// Intercation avec le menu deroulant des filtres departements 
		depLayer.on('click', function(e) {
			var insee_dep = e.layer.feature.properties.insee_dep;
			var selectElement = $('#selectDep');
			
			var index = selectedDepartments.indexOf(insee_dep);
			
			if (e.originalEvent.ctrlKey) {
				if (index > -1) {
					selectedDepartments.splice(index, 1);
					e.layer.setStyle({ fillOpacity: 0.0, weight: 1});
					selectElement.find(`option[value='${insee_dep}']`).prop('selected', false);
				} else {
					selectedDepartments.push(insee_dep);
					e.layer.setStyle({ fillOpacity: 0.0 , weight: 3});
					selectElement.find(`option[value='${insee_dep}']`).prop('selected', true);
				}
			} else {
				if (index > -1) {
					selectedDepartments = [];
					depLayer.eachLayer(function(layer) {
						layer.setStyle({ fillOpacity: 0.0 , weight: 1 });
					});
					selectElement.find('option').prop('selected', false);
				} else {
					selectedDepartments = [insee_dep];
					depLayer.eachLayer(function(layer) {
						layer.setStyle({ fillOpacity: 0.0 , weight: 1 });
					});
					e.layer.setStyle({ fillOpacity: 0.0, weight: 3});
					selectElement.find('option').prop('selected', false);
					selectElement.find(`option[value='${insee_dep}']`).prop('selected', true);
				}
			}
		
			selectElement.trigger('change');
			info.update();
		});



	// Intercation avec la couche lorsque la sélection change dans le menu déroulant
		$('#selectDep').on('change', function() {
			// départements actuellement sélectionnés dans le menu déroulant
			var selectedInMenu = $(this).val();

			// Parcourer chaque département dans votre GeoJSON
			depLayer.eachLayer(function(layer) {
				var insee_dep = layer.feature.properties.insee_dep;

				// Si le département est sélectionné dans le menu déroulant
				if (selectedInMenu.includes(insee_dep)) {
					layer.setStyle({ fillOpacity: 0.0, weight: 3 });
				} else {
					layer.setStyle({ fillOpacity: 0.0, weight: 1 });
				}
			});
		});






	//// création d'une couche des DNPJ ainsi que de ces options 
	// creation de la couche des DJPN	
		var dzpnLayer = L.geoJson(dataDzpn, 
					{style: function(feature)
						{	
						// paramétrage de la symbologie de la couche "departement"
						return { color: "#f28e55", weight: 1, fillColor: '#f28e55', fillOpacity: 0 };
						},
			onEachFeature: function(feature, layer ){
											
					// ajout des événements mouseover et mouseout
					layer.on({
						mouseover: function(e) {
								e.target.setStyle({
									weight: 3
								});
								info.update(e.target.feature.properties); // Mise à jour du contenu de la div info
						},
						mouseout: function(e) {
							if (selectedDZPN.indexOf(e.target.feature.properties.dzpn) === -1) {
								dzpnLayer.resetStyle(e.target);
							}
							info.update(); // Réinitialisation du contenu de la div info
						}
					});					
			}
		});


	// Création du gestionnaire d'événement pour un clic sur la couche 'dzpnLayer' : permettant la selection simple ou multiple pour filtrer les données selon les DZPN
	// Intercation avec le menu deroulant des filtres departements 
		dzpnLayer.on('click', function(e) {
			var dzpn = e.layer.feature.properties.dzpn;
			var selectElement = $('#selectDZPN');
			
			var index = selectedDZPN.indexOf(dzpn);
			
			if (e.originalEvent.ctrlKey) {
				if (index > -1) {
					selectedDZPN.splice(index, 1);
					e.layer.setStyle({ fillOpacity: 0.0, weight: 1});
					selectElement.find(`option[value='${dzpn}']`).prop('selected', false);
				} else {
					selectedDZPN.push(dzpn);
					e.layer.setStyle({ fillOpacity: 0.0 , weight: 3});
					selectElement.find(`option[value='${dzpn}']`).prop('selected', true);
				}
			} else {
				if (index > -1) {
					selectedDZPN = [];
					depLayer.eachLayer(function(layer) {
						layer.setStyle({ fillOpacity: 0.0 , weight: 1 });
					});
					selectElement.find('option').prop('selected', false);
				} else {
					selectedDZPN = [dzpn];
					depLayer.eachLayer(function(layer) {
						layer.setStyle({ fillOpacity: 0.0 , weight: 1 });
					});
					e.layer.setStyle({ fillOpacity: 0.0, weight: 3});
					selectElement.find('option').prop('selected', false);
					selectElement.find(`option[value='${dzpn}']`).prop('selected', true);
				}
			}
		
			selectElement.trigger('change');
			info.update();
		});



	// Intercation avec la couche lorsque la sélection change dans le menu déroulant
		$('#selectDZPN').on('change', function() {
			// Obtenez les départements actuellement sélectionnés dans le menu déroulant
			var selectedInMenu = $(this).val();

			// Parcourez chaque département dans votre GeoJSON
			dzpnLayer.eachLayer(function(layer) {
				var dzpn = layer.feature.properties.dzpn;

				// Si le département est sélectionné dans le menu déroulant
				if (selectedInMenu.includes(dzpn)) {
					layer.setStyle({ fillOpacity: 0.0, weight: 3 });
				} else {
					layer.setStyle({ fillOpacity: 0.0, weight: 1 });
				}
			});
		});








	
	//// création de la fenetre d'affichage du nom du departement et du DZPN
		var info = L.control({ position: 'topright' });

		info.onAdd = function(map) {
			this._div = L.DomUtil.create('div', 'info');
			this.update();
			return this._div;
		};

		info.update = function(props) {
			// vérifie si la couche dzpnLayer est active
			var dzpnIsActive = map.hasLayer(dzpnLayer);
			
			if (dzpnIsActive) {
				this._div.innerHTML = props ?
					"<p>" + props.dzpn_compl + "</p>" : 
					'Passez la souris sur un département <br> Cliquez pour en sélectionner un ou plusieurs';
			} else {
				this._div.innerHTML = props ? 
					"<p>" + props.nom_dep + " (" + props.insee_dep + ")" + "</p>" : 
					'Passez la souris sur un département <br> Cliquez pour en sélectionner un ou plusieurs';
			}
		};

		info.addTo(map);






	//// reinitalisation de la selection via de bouton de reinitalisation des filtres 
		document.getElementById("reinitialiserFiltres").addEventListener("click", function() {
			// Réinitialisation du département sélectionné
			selectedDepartments = [];
			depLayer.eachLayer(function(layer) {
				layer.setStyle({ fillOpacity: 0.0 });
			});
		
			// Réinitialiser le contenu de la div 'info'
			info.update();
		});
		



	


	//// gestion d'affichage des couches de fond administratif
		// Masque le filtre DZPN dès le départ
		$(".filtre:has(#selectDZPN)").hide();

		//// controle des couches de decoupage administratif
		$.when(depLayer, dzpnLayer).done(function() {
			var baseLayers = {
				"Départements": depLayer,
				"DZPN-DRPJ": dzpnLayer
			};

			L.control.layers(baseLayers).addTo(map);

			// Ajouter une couche à la carte par défaut
			depLayer.addTo(map);

			map.on('baselayerchange', function(eventLayer) {
				// À chaque fois qu'une nouvelle couche de base est ajoutée, on replace homLayer au-dessus.
				$(".select-multiple[name='dep_comm[]']").val(null).trigger("change");
				$(".select-multiple[name='dzpn_comm[]']").val(null).trigger("change");
				initializePoint(dataHom, dataDep, map);
			});
		});

		map.on('baselayerchange', function(eventLayer) {
			if (eventLayer.name === "Départements") {
				// Si DZPN est sélectionné, masquez le filtre DZPN et affichez le filtre Départements
				$(".filtre:has(#selectDZPN)").hide();
				$(".filtre:has(#selectDep)").show();
			} else if (eventLayer.name === "DZPN-DRPJ") {
				// Si Départements est sélectionné, masquez le filtre Départements et affichez le filtre DZPN
				$(".filtre:has(#selectDep)").hide();
				$(".filtre:has(#selectDZPN)").show();
			}
		});

};



//// initalisation des couches d'homicide, en point et en cerle proportionnel /////
function initializePoint(dataHom, dataDep, map){


	//Initalisation des histogrammes
    initializeHistogramme(dataHom);

    //// Lancer création des couches, apres les avoir supprimr si elle exciste deja (afin de les mettres à jour)
		// Vérifier si homLayer existe et a une méthode clearLayers avant de l'appeler
		if (homLayer && typeof homLayer.clearLayers === "function") {
			homLayer.clearLayers();
		}

		// Vérifier si homLayerDep existe et a une méthode clearLayers avant de l'appeler
		if (homLayerDep && typeof homLayerDep.clearLayers === "function") {
			homLayerDep.clearLayers();
		}

		createHom(dataHom, map);
		createHomDep(dataHom, dataDep, map);

	//// Après la création des couches, vérifiez le niveau de zoom actuel afin d'afffciher la bonne couche en premier
    var currentZoom = map.getZoom();
    if (currentZoom >= 11){
        if(!map.hasLayer(homLayer)) {
            map.addLayer(homLayer);
        }
        if(map.hasLayer(homLayerDep)) {
            map.removeLayer(homLayerDep);
        }
    } else {
        if(!map.hasLayer(homLayerDep)) {
            map.addLayer(homLayerDep);
        }
        if(map.hasLayer(homLayer)) {
            map.removeLayer(homLayer);
        }
    }

}


	
///// Creation des options de filtre et de representation pour les couches de points et les graphiques ////
function initializeOptionPoint(dataHom, dataDep, map){

	// Lancer la fonction d'initalisation des points 
	initializePoint(dataHom, dataDep, map);


	///Mettre à jour les representations en appliquant les filtres lors du changement de filtre 
	$(".select-multiple").on("change", function() {
		// exécuterchaque fois qu'une option de filtre est ajoutée ou retirée
		initializePoint(dataHom, dataDep, map);
	});
	
	

	// Réinitialisation des filtres
	document.getElementById("reinitialiserFiltres").addEventListener("click", function() {
		// Effacement des filtres
		removeFilter()

		// Affichage de toutes les couches
		initializePoint(dataHom, dataDep, map);
		
	});


	//// Ajout du controler de couche pour passer de la couche de point à la couche de point regroupé ou inversement
		var customControl = L.Control.extend({
		options: {
			position: 'topright'
		},

			onAdd: function(map) {
				var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom layer-switcher');
			
				container.onclick = function(){
					if (map.hasLayer(homLayerDep)) {
						map.removeLayer(homLayerDep);
						map.addLayer(homLayer);
					} else if (map.hasLayer(homLayer)) {
						map.removeLayer(homLayer); // Fix here
						map.addLayer(homLayerDep);
					}
				}

				// quand la souris passe sur le bouton, changer la couleur de fond en gris
				container.onmouseover = function(){
					this.style.backgroundColor = '#dedede';
				};

				// quand la souris quitte le bouton, remettre la couleur de fond en blanc
				container.onmouseout = function(){
					this.style.backgroundColor = 'white';
				};
				
				return container;
			}
		});
		// Ajouter le contrôleur à la carte
		map.addControl(new customControl());
	
};

	

// Récupération des valeurs des filtres
function getFilters() {
    return {
        types: $(".select-multiple[name='type_hom[]']").val(),
        armes: $(".select-multiple[name='arme_procede[]']").val(),
        annees: $(".select-multiple[name='annee_comm[]']").val(),
        lieu: $(".select-multiple[name='type_lieu[]']").val(),
        competence: $(".select-multiple[name='zone_competence[]']").val(),
        sexe: $(".select-multiple[name='sexe_vict[]']").val(),
        mineur: $(".select-multiple[name='mineure_vict[]']").val(),
		interco: $(".select-multiple[name='interconnaissance[]']").val(),
    	resolu: $(".select-multiple[name='resolution[]']").val(),
    	departement: $(".select-multiple[name='dep_comm[]']").val(),
		dzpn: $(".select-multiple[name='dzpn_comm[]']").val()
    };
}

// Efacer les filtres
function removeFilter() {
    $(".select-multiple[name='type_hom[]']").val(null).trigger("change");
    $(".select-multiple[name='arme_procede[]']").val(null).trigger("change");
    $(".select-multiple[name='annee_comm[]']").val(null).trigger("change");
    $(".select-multiple[name='type_lieu[]']").val(null).trigger("change");
    $(".select-multiple[name='zone_competence[]']").val(null).trigger("change");
    $(".select-multiple[name='sexe_vict[]']").val(null).trigger("change");
    $(".select-multiple[name='mineure_vict[]']").val(null).trigger("change");
    $(".select-multiple[name='resolution[]']").val(null).trigger("change");
    $(".select-multiple[name='interconnaissance[]']").val(null).trigger("change");
    $(".select-multiple[name='dep_comm[]']").val(null).trigger("change");
	$(".select-multiple[name='dzpn_comm[]']").val(null).trigger("change");
}




///// Creation couche de point de la base des homicides localisé à l'adresse par victime ////
function createHom(dataHom){

	//récuperation des filtres 
	var filters = getFilters();

	console.log(dataHom)

    /// Creation de la couche de point avec les filtres si activés
    homLayer = L.geoJson(dataHom, {
        filter: function(feature, layer) {
            // vérification des types
            var typeValide = (filters.types.length == 0 || filters.types.includes(feature.properties.type_hom_detail));
            // vérification des armes
            var armeValide = (filters.armes.length == 0 || filters.armes.includes(feature.properties.arme_procede_detail));
            // vérification des années
            var anneeValide = (filters.annees.length == 0 || filters.annees.includes(feature.properties.annee_comm));

            var lieuValide = (filters.lieu.length == 0 || filters.lieu.includes(feature.properties.type_lieu));
            var competenceValide = (filters.competence.length == 0 || filters.competence.includes(feature.properties.zone_competence_s));
            var sexeValide = (filters.sexe.length == 0 || filters.sexe.includes(feature.properties.sex_vict));
            var mineurValide = (filters.mineur.length == 0 || filters.mineur.includes(feature.properties.vict_mineure_majeure));
			var intercoValide = (filters.interco.length == 0 || filters.interco.includes(feature.properties.interconnaissance_vict_auteur));
        	var resoluValide = (filters.resolu.length == 0 || filters.resolu.includes(feature.properties.elucidation));

        	var departementValide = (filters.departement.length == 0 || filters.departement.includes(feature.properties.insee_dep));
			var dzpnValide = (filters.dzpn.length == 0 || filters.dzpn.includes(feature.properties.dzpn));

            return typeValide && armeValide && anneeValide && lieuValide && competenceValide && sexeValide && mineurValide && intercoValide && resoluValide &&  departementValide&& dzpnValide;
        },
        pointToLayer: function (feature, latlng) {
			// Création d'un marqueur circulaire avec un style basé sur l'attribut 'note'
			var marker = L.circleMarker(latlng, {
				radius: feature.properties.nbre_vict_meme_adress * 5, // Ajustez le multiplicateur en fonction de la plage de vos notes
				fillColor: "#c82865",
				color: "#c82865", // Couleur du contour rouge
				weight: 1, // Épaisseur du contour
				opacity: 1,
				fillOpacity: 0.5
			});
			marker.on({
				mouseover: function(e) {
					e.target.setStyle({
						radius: feature.properties.nbre_vict_meme_adress * 10, // Doubler la taille
						fillColor: '#c82865', // Changer la couleur
						fillOpacity: 1
					});
				},
				mouseout: function(e) {
					e.target.setStyle({
						radius: feature.properties.nbre_vict_meme_adress * 5, // Restaurer la taille originale
						fillColor: "#c82865", // Restaurer la couleur originale
						fillOpacity: 0.5
					});
				},
			});
			marker.bindPopup(
						"<b>Identifiant de l'affaire : </b>" + feature.properties.id_aff+ '<br>' 
						+ "<b>Année de commission : </b>" + feature.properties.annee_comm+ '<br>' 
						+ "<b>Nombre de victime : </b>" + feature.properties.nbre_vict+ '<br>' 
						+ "<b>Département : </b>" + feature.properties.nom_dep + " (" + feature.properties.insee_dep + ')<br>'
						+ "<b>Commune : </b>" + feature.properties.nom_com+ '<br>'
						+ "<b>Type d'homicide : </b>" + feature.properties.type_hom_detail+ '<br>'
						+ "<b>Arme utilisée : </b>" + feature.properties.arme_procede_detail+ '<br>'
						+ "<b>Circonstances : </b>" + feature.properties.mobile
						);
		return marker;
		}
	});

}



//// Création de la couche de point regroupé par département en cercle proportionels ////
function createHomDep(dataHom, dataDep, map){

	//recuperation des filtres 
	var filters = getFilters();

	// Filtrer les données
	var filteredData = dataHom.features.filter(function(feature) {
		var typeValide = (filters.types.length == 0 || filters.types.includes(feature.properties.type_hom_detail));
		var armeValide = (filters.armes.length == 0 || filters.armes.includes(feature.properties.arme_procede_detail));
		var anneeValide = (filters.annees.length == 0 || filters.annees.includes(feature.properties.annee_comm));
		var lieuValide = (filters.lieu.length == 0 || filters.lieu.includes(feature.properties.type_lieu));
		var competenceValide = (filters.competence.length == 0 || filters.competence.includes(feature.properties.zone_competence_s));
		var sexeValide = (filters.sexe.length == 0 || filters.sexe.includes(feature.properties.sex_vict));
		var mineurValide = (filters.mineur.length == 0 || filters.mineur.includes(feature.properties.vict_mineure_majeure));
		var intercoValide = (filters.interco.length == 0 || filters.interco.includes(feature.properties.interconnaissance_vict_auteur));
		var resoluValide = (filters.resolu.length == 0 || filters.resolu.includes(feature.properties.elucidation));

		var departementValide = (filters.departement.length == 0 || filters.departement.includes(feature.properties.insee_dep));
		var dzpnValide = (filters.dzpn.length == 0 || filters.dzpn.includes(feature.properties.dzpn));

		return typeValide && armeValide && anneeValide && lieuValide && competenceValide && sexeValide && mineurValide && intercoValide && resoluValide &&  departementValide && dzpnValide;

	});

	// Grouper les données par 'insee_dep'
	var groupedData = _.groupBy(filteredData, function(feature) {
		return feature.properties.insee_dep;
	});
	
	// Joindre les données groupées aux centroides
	dataDep.features.forEach(function(feature) {
		var dep = feature.properties["insee_dep"];
		if (groupedData[dep]) {
			feature.properties.count = groupedData[dep].length;
		} else {
			feature.properties.count = 0;
		}

		// Enregistrez les limites du polygone original
		if(!feature.properties.originalGeometry) { 
			feature.properties.originalGeometry = turf.clone(feature.geometry);
		}
		var bounds = turf.bbox(feature.properties.originalGeometry);
		feature.properties.bounds = bounds;

		// Convertir le polygone en centroïde
		var centroid = turf.centroid(feature.geometry);
		feature.geometry = centroid.geometry;
	});

	//// Calcul de la taille et couleur des cerles proportionnels

		// Calculer le min et max 'count' dans vos données 
		let counts = dataDep.features.map(function(feature) { return feature.properties.count; });
		let minCount = Math.min.apply(null, counts);
		let maxCount = Math.max.apply(null, counts);

		// mettre à l'échelle les valeurs 'count'
		function getRadii(minCount, maxCount) {
			let baseMinRadius = 2;    // Valeur de base pour minRadius lorsque minCount est 0
			let baseMaxRadius = 8;   // Valeur de base pour maxRadius lorsque maxCount est 0
			let scalingFactor = 0.3; // Ajustez selon vos besoins

			return {
				minRadius: baseMinRadius + minCount * scalingFactor,
				maxRadius: baseMaxRadius + maxCount * scalingFactor
			};
		}

		// Mettre à l'échelle les valeurs 'count'
		function scaleCount(count, minCount, maxCount) {
			let { minRadius, maxRadius } = getRadii(minCount, maxCount);
			return ((count - minCount) / (maxCount - minCount)) * (maxRadius - minRadius) + minRadius;
		}

		/// pour les couleurs
		let range = (maxCount - minCount) / 3;

		function getColor(count) {
			return count > (minCount + 2 * range) ? '#790a34' :
				count > (minCount + range) ? '#c64d7b' :
												'#e991b2';
		}


	
	////  Creation des cercles proportionnels
	homLayerDep = L.geoJson(dataDep, {
		filter: function(feature, layer) {
			var countNotZero = feature.properties.count != 0;
            return countNotZero;
        },
		pointToLayer: function (feature, latlng) {
			let radius = scaleCount(feature.properties.count, minCount, maxCount);
			let circleMarker = L.circleMarker(latlng, {
				radius: radius,
				fillColor: getColor(feature.properties.count), 
				color: getColor(feature.properties.count), 
				weight: 1, 
				opacity: 1,
				fillOpacity: 0.5
			});
	
			// Paramétrage de la popup de la couche "departement" pour le clic
			circleMarker.bindPopup("<h3>" + feature.properties.NOM + "</h3>");
	
			// Événement de survol pour agrandir le cercle et afficher 'count'
			circleMarker.on('mouseover', function (e) {
				this.setRadius(radius + 10);  // Double la taille du cercle
				this.setStyle({fillOpacity: 0.8}); // Augmente l'opacité du remplissage
				this.bindTooltip("" + feature.properties.count, 
				{permanent: true, direction: "center", className: 'tooltip'}).openTooltip(); // Affiche 'count' au centre du cercle
			});
	
			// Événement de sortie de survol pour rétablir la taille d'origine du cercle et masquer 'count'
			circleMarker.on('mouseout', function (e) {
				this.setRadius(radius);  // Rétablit la taille d'origine du cercle
				this.setStyle({fillOpacity: 0.5}); // Rétablit l'opacité du remplissage
				this.unbindTooltip(); // Enlève 'count' du cercle
			});
	
			return circleMarker;
		},
		onEachFeature: function (feature, layer) {
			layer.on('click', function (e) {
				zoomendActive = false; // Désactiver l'événement 'zoomend'
				// e.target est la couche cliquée
				var id_dep = e.target.feature.properties.insee_dep;
				var bounds = e.target.feature.properties.bounds; // Récupère les limites de l'objet
				map.fitBounds([
					[bounds[1], bounds[0]], // Point sud-ouest de la bounding box
					[bounds[3], bounds[2]]  // Point nord-est de la bounding box
				]); // Ajuste la vue de la carte pour contenir la bounding box du polygone
				// Si la couche cliquée est homLayerDep, alors supprimez-la et ajoutez homLayer
				if(map.hasLayer(homLayerDep)) {
					// Parcourez chaque élément de la couche et réinitialisez leur état
					homLayerDep.eachLayer(function (layer) {
						// Ici, 'layer' représente chaque élément de la couche
						var circleMarker = layer;
						
						// Rétablir l'état original
						var radius = circleMarker.getRadius();
						circleMarker.setRadius(radius);  // Rétablit la taille d'origine du cercle
						circleMarker.setStyle({fillOpacity: 0.4}); // Rétablit l'opacité du remplissage
						circleMarker.unbindTooltip(); // Enlève 'count' du cercle
					});
		
					map.removeLayer(homLayerDep);
					if(!map.hasLayer(homLayer)) {
						map.addLayer(homLayer);
					}
				}

				initializeHistogramme(dataHom,id_dep, []);
			});
		}
	}).addTo(map);
	
};
