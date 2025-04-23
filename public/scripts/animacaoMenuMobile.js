function animacaoMenu(){

    var divMenu = document.getElementById("navBar-mobile")
    var divMenuOptions = document.getElementById("options-menu-mobile")
    var divPerfil = document.getElementById("box-perfil")
    
    
    if(divMenu.style.height === "7vh"){
        divMenu.style.height = "100vh";
        
        divPerfil.style.opacity = "1";
        divPerfil.style.visibility = "visible";

        setTimeout(() => {
            divMenuOptions.style.opacity = "1";
            divMenuOptions.style.visibility = "visible";
        },250)

    } else {
        divMenu.style.height = "7vh";

        divMenuOptions.style.opacity = "0";
        divMenuOptions.style.visibility = "hidden";
        
        divPerfil.style.opacity = "0";
        divPerfil.style.visibility = "hidden";
    }
}