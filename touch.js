
var ArcRotateCameraPointersInput = BABYLON.ArcRotateCameraPointersInput;

ArcRotateCameraPointersInput.prototype.attachControl = function (element, noPreventDefault) {
    var _this = this;
    var engine = this.camera.getEngine();
    var cacheSoloPointer; // cache pointer object for better perf on camera rotation
    var pointA, pointB;
    var lastMiddleY = 0;
    var previousPinchDistance = 0;
    this._pointerInput = function (p, s) {
        var evt = p.event;
        if (p.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            try {
                evt.srcElement.setPointerCapture(evt.pointerId);
            }
            catch (e) {
            }
            // Manage panning with right click
            _this._isRightClick = evt.button === 2;
            // manage pointers
            cacheSoloPointer = { x: evt.clientX, y: evt.clientY, pointerId: evt.pointerId, type: evt.pointerType };
            if (pointA === undefined) {
                pointA = cacheSoloPointer;
            }
            else if (pointB === undefined) {
                pointB = cacheSoloPointer;
            }
            if (!noPreventDefault) {
                evt.preventDefault();
            }
        }
        else if (p.type === BABYLON.PointerEventTypes.POINTERUP) {
            try {
                evt.srcElement.releasePointerCapture(evt.pointerId);
            }
            catch (e) {
            }
            cacheSoloPointer = null;
            previousPinchDistance = 0;
            //would be better to use pointers.remove(evt.pointerId) for multitouch gestures, 
            //but emptying completly pointers collection is required to fix a bug on iPhone : 
            //when changing orientation while pinching camera, one pointer stay pressed forever if we don't release all pointers  
            //will be ok to put back pointers.remove(evt.pointerId); when iPhone bug corrected
            pointA = pointB = undefined;
            if (!noPreventDefault) {
                evt.preventDefault();
            }
        }
        else if (p.type === BABYLON.PointerEventTypes.POINTERMOVE) {
            if (!noPreventDefault) {
                evt.preventDefault();
            }
            // One button down
            if (pointA && pointB === undefined) {
                if (_this.panningSensibility !== 0 &&
                    ((_this._isCtrlPushed && _this.camera._useCtrlForPanning) ||
                        (!_this.camera._useCtrlForPanning && _this._isRightClick))) {
                    _this.camera
                        .inertialPanningX += -(evt.clientX - cacheSoloPointer.x) / _this.panningSensibility;
                    _this.camera
                        .inertialPanningY += (evt.clientY - cacheSoloPointer.y) / _this.panningSensibility;
                }
                else {
                    var offsetX = evt.clientX - cacheSoloPointer.x;
                    var offsetY = evt.clientY - cacheSoloPointer.y;
                    _this.camera.inertialAlphaOffset -= offsetX / _this.angularSensibilityX;
                    _this.camera.inertialBetaOffset -= offsetY / _this.angularSensibilityY;
                }
                cacheSoloPointer.x = evt.clientX;
                cacheSoloPointer.y = evt.clientY;
            }
            else if (pointA && pointB) {
                //if (noPreventDefault) { evt.preventDefault(); } //if pinch gesture, could be useful to force preventDefault to avoid html page scroll/zoom in some mobile browsers
                var ed = (pointA.pointerId === evt.pointerId) ? pointA : pointB;
                ed.x = evt.clientX;
                ed.y = evt.clientY;
                var direction = _this.pinchInwards ? 1 : -1;
                var distX = pointA.x - pointB.x;
                var distY = pointA.y - pointB.y;
                var pinchSquaredDistance = (distX * distX) + (distY * distY);
                if (previousPinchDistance === 0) {
                    previousPinchDistance = pinchSquaredDistance;
                    return;
                }
                /*-------------------------------------
                    I EDITED THIS PART
                ---------------------------------------*/
                if (pinchSquaredDistance !== previousPinchDistance) {
                    //Zoom
                    _this.camera
                        .inertialRadiusOffset += (pinchSquaredDistance - previousPinchDistance) /
                        (_this.pinchPrecision *
                            ((_this.angularSensibilityX + _this.angularSensibilityY) / 2) *
                            direction);
                    cacheSoloPointer.x = evt.clientX;
                    cacheSoloPointer.y = evt.clientY;
                    previousPinchDistance = pinchSquaredDistance;

                    //I added this bit to do the panning
                    var middleY = (pointA.y + pointB.y) / 2;
                    if (lastMiddleY == 0) lastMiddleY = middleY;
                    var totalY = (middleY-lastMiddleY);
                    if (_this.panningSensibility !== 0) {
                        _this.camera
                            .inertialPanningY += (totalY) / _this.panningSensibility;
                    }								
                    lastMiddleY = middleY;                    
                }
            }
        }
    };
    this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, BABYLON.PointerEventTypes.POINTERDOWN | BABYLON.PointerEventTypes.POINTERUP | BABYLON.PointerEventTypes.POINTERMOVE);
    this._onContextMenu = function (evt) {
        evt.preventDefault();
    };
    if (!this.camera._useCtrlForPanning) {
        element.addEventListener("contextmenu", this._onContextMenu, false);
    }
    this._onLostFocus = function () {
        //this._keys = [];
        pointA = pointB = undefined;
        previousPinchDistance = 0;
        cacheSoloPointer = null;
    };
    this._onKeyDown = function (evt) {
        _this._isCtrlPushed = evt.ctrlKey;
    };
    this._onKeyUp = function (evt) {
        _this._isCtrlPushed = evt.ctrlKey;
    };
    this._onMouseMove = function (evt) {
        if (!engine.isPointerLock) {
            return;
        }
        var offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
        var offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;
        _this.camera.inertialAlphaOffset -= offsetX / _this.angularSensibilityX;
        _this.camera.inertialBetaOffset -= offsetY / _this.angularSensibilityY;
        if (!noPreventDefault) {
            evt.preventDefault();
        }
    };
    this._onGestureStart = function (e) {
        if (window.MSGesture === undefined) {
            return;
        }
        if (!_this._MSGestureHandler) {
            _this._MSGestureHandler = new MSGesture();
            _this._MSGestureHandler.target = element;
        }
        _this._MSGestureHandler.addPointer(e.pointerId);
    };
    this._onGesture = function (e) {
        _this.camera.radius *= e.scale;
        if (e.preventDefault) {
            if (!noPreventDefault) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
    };
    element.addEventListener("mousemove", this._onMouseMove, false);
    element.addEventListener("MSPointerDown", this._onGestureStart, false);
    element.addEventListener("MSGestureChange", this._onGesture, false);
    BABYLON.Tools.RegisterTopRootEvents([
        { name: "keydown", handler: this._onKeyDown },
        { name: "keyup", handler: this._onKeyUp },
        { name: "blur", handler: this._onLostFocus }
    ]);
};

var createScene = function () {

    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.ArcRotateCamera("camera1", -1*Math.PI/2, 0, 5, new BABYLON.Vector3(0, 5, -10), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.panningAxis = new BABYLON.Vector3(0, 1, 0);
    camera.attachControl(canvas, true, false);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Our built-in 'sphere' shape. Params: name, subdivs, size, scene
    var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);

    // Move the sphere upward 1/2 its height
    sphere.position.y = 1;

    // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
    var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);

    return scene;

};