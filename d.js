var createScene = function () {

    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 0, 0), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    BABYLON.SceneLoader.LoadAssetContainer("https://models.babylonjs.com/", "fish.glb", scene, function (container) {
        // Scale and position the loaded model (First mesh loaded from gltf is the root node)
        container.meshes[0].scaling.scaleInPlace(0.1)
        container.meshes[0].position.z = 5
        container.meshes[0].position.y = -1

        // Add loaded file to the scene
        container.addAllToScene();
    });

    return scene;

};