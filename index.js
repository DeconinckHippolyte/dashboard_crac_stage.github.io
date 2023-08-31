

//// animation pour le 'a propos' 
document.getElementById('about-button').addEventListener('click', function(event) {
    event.preventDefault();
    document.getElementById('containAbout').style.display = 'flex';
    document.getElementById('about').style.display = 'flex';
});

document.getElementById('closeAbout').addEventListener('click', function() {
	document.getElementById('containAbout').style.display = 'none';
    document.getElementById('about').style.display = 'none';
	
});


///initalisation de select2 dans le docuement poure créer les listes de menu deroulante
$(document).ready(function() {
    $('.select-multiple').select2();
});


//initalisation de la liste deroulante des départements 
function initializeSelectDep(dataDep){
	
	// Extrait et tri des départements par code INSEE
	var sortedDepartments = dataDep.features.sort((a, b) => parseInt(a.properties.insee_dep) - parseInt(b.properties.insee_dep));

	// Sélectionnez votre élément <select>
	var selectElement = document.getElementById("selectDep");

	// Parcourez vos départements pour ajouter chaque département comme une option dans votre <select>
	sortedDepartments.forEach(feature => {
		var properties = feature.properties;
		var option = document.createElement("option");
		option.value = properties.insee_dep;
		option.textContent = properties.insee_dep + " - " + properties.nom_dep;
		selectElement.appendChild(option);
	});
}



//initalisation de la liste deroulante des dzpn 
function initializeSelectDZPN(dataDzpn){
	
    // Votre liste ordonnée
    var orderList = ["paris", "versailles", "nord", "est", "sud_est", "sud", "sud_ouest", "ouest", "antille_guyane", "ocean_indien", "ocean_pacifique", "autre"];  

    // Trier les départements selon orderList
    var sortedDZPN= dataDzpn.features.sort((a, b) => {
        var indexOfA = orderList.indexOf(a.properties.dzpn);
        var indexOfB = orderList.indexOf(b.properties.dzpn);

        if (indexOfA === -1 && indexOfB === -1) return 0;  // Les deux éléments ne sont pas dans orderList
        if (indexOfA === -1) return 1;  // a n'est pas dans orderList mais b l'est
        if (indexOfB === -1) return -1;  // b n'est pas dans orderList mais a l'est

        // Sinon, triez selon l'ordre dans orderList
        return indexOfA - indexOfB;
    });

    // Sélectionnez votre élément <select>
    var selectElement = document.getElementById("selectDZPN");

    // Parcourez vos départements pour ajouter chaque département comme une option dans votre <select>
    sortedDZPN.forEach(feature => {
		var properties = feature.properties;
		var option = document.createElement("option");
		option.value = properties.dzpn;
		option.textContent = properties.dzpn_compl ;
		selectElement.appendChild(option);
    });

}

// creation des animations de definition
    const defOverlay = document.getElementById('def-overlay');
    const defContent = document.getElementById('def-content');
    const defText = document.getElementById('def-text');
    const defClose = document.getElementById('def-close');


    /// pouvir la definition 
    function showDef(message) {
        defText.innerHTML = message; // Utilisez innerHTML ici
        defOverlay.classList.remove('hidden');
    }

    // Ferme la definition
    defClose.addEventListener('click', () => {
        defOverlay.classList.add('hidden');
    });


    // Sélectionnez tous les éléments avec la classe 'info-icon'
    document.querySelectorAll('.info-icon').forEach(function(icon) {
        icon.addEventListener('click', function() {
            const definition = this.getAttribute('data-definition');
            showDef(definition);
        });
    });
