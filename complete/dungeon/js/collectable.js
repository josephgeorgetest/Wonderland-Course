if (GLOBALS == undefined ){
    var GLOBALS = { holding: false };
}else if (GLOBALS.holding == undefined){
    GLOBALS.holding = false;
}

WL.registerComponent('collectable', {
    controller: { type: WL.Type.Object },
    collectablesGroup: { type: WL.Type.Int, default: 6 },
    collisionIndicator: { type: WL.Type.Object }, 
    moveToController: { type: WL.Type.Bool, default: false },
    rotateYOnMove: { type: WL.Type.Float, default: 0 },
    handedness: {type: WL.Type.Enum, values: ['input component', 'left', 'right', 'none'], default: 'input component'}
}, {
    init: function() {    
        this._tempVec = new Float32Array(3);
        this._tempVec0 = new Float32Array(3);
        this._grabParent = null;
        this._grabTransform = new Float32Array(8);
        this._grabScale = new Float32Array(3);

    },
    start: function() {
        console.log('collectable start()');
        this._input = this.object.getComponent('input');
        if(!this._input) {
            console.error(this.object.name, "collectable.js: input component is required on the object");
            return;
        }else if(this.handedness == 0){
            this.handedness = this._input.handedness;
        }
        this._cursor = this.object.getComponent('cursor'); 
        this._teleport = this.object.getComponent('teleport');
        this.collisionIndicator.active = false;
        WL.onXRSessionStart.push(this.setupVREvents.bind(this));
    },
    setupVREvents: function(s){
        this.session = s;
        s.addEventListener('end', function() {
            /* Reset cache once the session ends to rebind select etc, in case
             * it starts again */
            this.session = null;
        }.bind(this));

        s.addEventListener('select', (e) => {
            console.log(`collectable select ${this.handedness}`);
            if (e.inputSource.handedness != this.handedness) return;
            
            if ( !GLOBALS.holding ){
                const rayHit = this._rayHit;
                if(rayHit) {
                    const grabObject = rayHit.object;

                    if (grabObject){
                        this._grabParent = grabObject.parent;
                        this._grabPhysX = grabObject.getComponent('physx');
                        this._grabPhysX.active = false;
                        this._grabTransform.set( grabObject.transformLocal );
                        this._grabScale.set( grabObject.scalingLocal );
                        
                        if (this.moveToController){
                            this.reparentReset( grabObject, this.object );
                            this.showController( false );
                        }else{
                            this.reparentKeepTransform( grabObject, this.object );
                        }
                        if (this._teleport ) this._teleport.active = false;
                        this._grabObject = grabObject;
                        GLOBALS.holding = true;
                        GLOBALS.handedness = this.handedness;
                        console.log(`Pickup ${GLOBALS.handedness}`);

                        this.collisionIndicator.active = false;
                    }
                }
            }else{
                if (GLOBALS.holding && GLOBALS.handedness == this.handedness ){
                    console.log(`Drop ${GLOBALS.handedness}`);
                    this._grabObject.transformLocal.set( this._grabTransform );
                    this._grabObject.scalingLocal.set( this._grabScale );
                    this._grabObject.parent = this._grabParent;
                    this._grabObject.setDirty();

                    if ( this._grabPhysX ) this._grabPhysX.active = true;

                    if (this._teleport ) this._teleport.active = true;

                    this.showController( true );

                    GLOBALS.holding = false;
                    GLOBALS.handedness = 0;
                }
                
            }
        });
    },
    showController: function( mode ){
        if (this._cursor){
            this._cursor.cursorRayObject.children[0].active = this._cursor.cursorObject.active = mode;
        }
        if (this.controller){
            const model = this.controller.children[0];
            model.children.forEach( c => c.active = mode );
        }
    },
    update: function(dt) {
        //console.log('update() with delta time', dt);
        if ( !GLOBALS.holding ){
            const origin = this._tempVec0;
            glMatrix.quat2.getTranslation(origin, this.object.transformWorld);
            const direction = this.object.getForward( this._tempVec );
            let rayHit = WL.physics.rayCast(origin, direction, 1 << this.collectablesGroup, 10 );
            if(rayHit.hitCount > 0) {
                this.collisionIndicator.resetTranslationRotation();
                this.collisionIndicator.translate( rayHit.locations[0] );
                //console.log( `collectable.js: update > rayHit.locations[0] = ${rayHit.locations[0]} `);
                this.collisionIndicator.active = true; 
                this._rayHit = { location: rayHit.locations[0], object: rayHit.objects[0] };
            }else{
                this.collisionIndicator.active = false;
                delete this._rayHit;
            }
        }
    },
    reparentReset: function (object, newParent) {
        object.resetTransform( );
        object.rotateAxisAngleDeg([0, 1, 0], this.rotateYOnMove ); 
        object.scalingLocal.set( this._grabScale );
        object.parent = newParent;
        object.setDirty();
    },
    reparentKeepTransform: function (object, newParent) {
        //From Pipo's code
        let newParentTransformWorld = [];
        glMatrix.quat2.identity(newParentTransformWorld);
        let newParentScalingWorld = [1, 1, 1];

        if (newParent) {
            newParentTransformWorld = newParent.transformWorld;
            newParentScalingWorld = newParent.scalingWorld;
        }

        let tempTransform = new Float32Array(8);

        glMatrix.quat2.conjugate(tempTransform, newParentTransformWorld);
        glMatrix.quat2.mul(tempTransform, tempTransform, object.transformWorld);
        object.transformLocal.set(tempTransform);

        let newScale = new Float32Array(3);
        glMatrix.vec3.divide(newScale, object.scalingLocal, newParentScalingWorld);
        object.resetScaling();
        object.scale(newScale);

        object.parent = newParent;

        object.setDirty();
    }
});
