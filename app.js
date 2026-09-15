console.log("SoulGlaz initialized");

const objects = document.querySelectorAll(".object");

objects.forEach((object) => {

    object.addEventListener("click", () => {

        alert(
            "SOULGLAZ OBJECT\n\n" +
            "Status: LIVE\n" +
            "Tracking: ACTIVE"
        );

    });

});