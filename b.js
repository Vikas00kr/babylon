/**
 * This scene show how to:
 * - load a gltf file
 * - assign lightmaps on objects (some modes are availables below)
 * - quickly animate things
 * 
 * Sources here: https://github.com/Vinc3r/cornellBox
 * 
 */

var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3.White;
    scene.ambientColor = new BABYLON.Color3.White;
    var hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("https://raw.githubusercontent.com/Vinc3r/cornellBox/master/BJS-PBR/assets/neutral_env_EnvHDR.dds", scene);
    hdrTexture.name = "envTex";
    hdrTexture.gammaSpace = false;
    scene.createDefaultSkybox(hdrTexture, true, 1000, 0);

    var universalCamera = new BABYLON.UniversalCamera("universalCamera", new BABYLON.Vector3(0,1,0), scene);
    universalCamera.speed = 0.1;
    universalCamera.fov = 1.2;
    universalCamera.minZ = 0.01;
    universalCamera.position = new BABYLON.Vector3(0, 1.5, 4);
    universalCamera.rotation = new BABYLON.Vector3(0, -3.15, 0);
    scene.activeCamera = universalCamera;
    scene.activeCamera.attachControl(canvas);

    var gltfLoader = BABYLON.SceneLoader.Append(
        "https://raw.githubusercontent.com/Vinc3r/cornellBox/master/BJS-PBR/assets/",
        "cornellBox-PBR.gltf",
        scene,
        function(scene){
            // lightmap assignation
            var lightmappedObjects = [
                "cornellBox.000",
                "bloc.000",
                "suzanne.000"
            ];
            for(i = 0; i < lightmappedObjects.length; i++){
                // we create the lightmap using the mesh name 
                var url = "https://raw.githubusercontent.com/Vinc3r/cornellBox/master/BJS-PBR/assets/LM/" + lightmappedObjects[i] + ".LM.png";
                var lightmap = new BABYLON.Texture(url, scene);
                lightmap.name = lightmappedObjects[i] + ".LM";
                lightmap.coordinatesIndex = 1;
                lightmap.level = 1;
                lightmap.vScale = -1; // <- why needed?
                var mesh = scene.getMeshByName(lightmappedObjects[i]);
                var meshChildren = mesh.getChildren();
                if (!mesh || !mesh.material && (meshChildren.length == 0)) {
                    continue;
                };
                if(!mesh.material && (meshChildren.length > 0)){
                    for(j = 0; j < meshChildren.length; j++){
                        var material = meshChildren[j].material;
                        material.lightmapTexture = lightmap;
                        material.useLightmapAsShadowmap = true;
                    }
                };
                if(mesh.material){
                    var material = mesh.material;
                    material.lightmapTexture = lightmap;
                    material.useLightmapAsShadowmap = true;
                };
            };

        // the mesh fake-light on the ceiling
        var lightMaterial = scene.getMaterialByName("light.000");
        lightMaterial.emissiveColor = new BABYLON.Color3.White;

        // some things on the logo mesh
        var bjsLogo = scene.getMeshByName("BJSlogo.000");
        bjsLogo.position.y = 1.5;
        scene.getMaterialByName("BJS-3D-logo_white.01.000").emissiveColor = new BABYLON.Color3.White;
        var bjsRedMaterial = scene.getMaterialByName("BJS-3D-logo_red.01.000");
        for(k = 0; k < bjsLogo._children.length; k++){
            bjsLogo._children[k].material.metallic = 0.1;
            bjsLogo._children[k].material.roughness = 0;
        };
        bjsRedMaterial.metallic = 1;

        // prepare the room to receive shadows
        cornellBox = scene.getMeshByName("cornellBox.000");
    
        for(k = 0; k < cornellBox._children.length; k++) {
            cornellBox._children[k].receiveShadows = true;
        }
        cornellBox.receiveShadows = true;
        
         // dyn light to generate shadows 
        var light = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(0, -1, 0), scene);
        light.position = new BABYLON.Vector3(0, 3, 0);
        // why not using glow?
        new BABYLON.GlowLayer("glow", scene, {
            mainTextureFixedSize: 256,
            blurKernelSize: 32
        });
        // logo shadow
        var shadowGenerator = new BABYLON.ShadowGenerator(128, light);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.addShadowCaster(bjsLogo);
        // some animations on the logo
        var time = 0; //this will be used as a time variable
        scene.registerBeforeRender(function() {
            time += 0.1;
            bjsLogo.rotation.x += .008;
            bjsLogo.rotation.y -= .009;
            bjsLogo.rotation.z -= .01;
            bjsRedMaterial.emissiveColor = new BABYLON.Color3( ( Math.cos(time)* 0.5 ) + 0.5 , 0, 0);            
            bjsLogo.position.y = (Math.cos(time*0.1)*0.15) + 1.5;
        });
    });
    return scene;

};