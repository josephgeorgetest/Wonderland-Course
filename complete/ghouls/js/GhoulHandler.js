WL.registerComponent('GhoulHandler', {
    path: { type: WL.Type.Object },
    target: { type: WL.Type.Object },
    speed: { type: WL.Type.Float, default: 2.0 },
    attackAnim: { type: WL.Type.Animation },
    dieAnim: { type: WL.Type.Animation },
    walkAnim: { type: WL.Type.Animation }
}, {
    init: function() {
        //console.log('init() with param', this.param);
        this.tmpVec = glMatrix.vec3.create();
        this.tmpVec1 = glMatrix.vec3.create();
        this.tmpQuat = glMatrix.quat.create();
        this.tmpQuat1 = glMatrix.quat.create();
        this.targetRotation = glMatrix.quat.create();
        this.target = glMatrix.vec3.create();
        this.direction = glMatrix.vec3.create();
    },
    start: function() {
        //console.log('start() with param', this.param);
        this.animComp = this.object.getComponent('animation');
        this.spawn();
    },
    spawn: function(){
        this.animComp.animation = this.walkAnim;
        this.animComp.play();
        this.setPathSection( 0 );
    },
    setPathSection( index ){
        this.pathIndex = index;
        this.playerTarget = ( index < (this.path.children.length-1) );
        if ( this.playerTarget ){
            this.getNode( this.tmpVec, index );
            this.vrCamera.getTranslationWorld( this.target );
            this.target[1] = this.tmpVec[1];
        }else{
            this.getNode( this.tmpVec, index );
            this.getNode( this.target, index + 1 );
        }
        glMatrix.quat.copy( this.tmpQuat, this.object.rotationWorld );
        glMatrix.vec3.copy( this.tmpVec1, this.target );
        this.tmpVec1[1] = this.tmpVec[1];
        this.object.setTranslationWorld( this.tmpVec );
        this.object.lookAt( this.tmpVec1 );
        glMatrix.quat.copy( this.targetRotation, this.object.rotationWorld );
        this.object.getForward( this.direction );
        glMatrix.vec3.scale( this.direction, this.direction, this.speed );
        if (index > 0){
            //this.object.setRotationWorld( this.tmpQuat );
            //this.blendRotation();
        } 
    },
    getNode: function( vec, index ){
        this.path.children[index].getTranslationWorld( vec );
    },
    update: function(dt) {
        //console.log('update() with delta time', dt);
        glMatrix.vec3.copy( this.tmpVec, this.direction );
        glMatrix.vec3.scale( this.tmpVec, this.tmpVec, dt );
        this.object.getTranslationWorld( this.tmpVec1 );
        const dist1 = glMatrix.vec3.distance( this.tmpVec1, this.target );
        this.object.translate( this.tmpVec );
        this.object.getTranslationWorld( this.tmpVec1 );
        const dist2 = glMatrix.vec3.distance( this.tmpVec1, this.target );
        if (dist2 > dist1){
            if (this.playerTarget){
                this.spawn();
            }else{
                this.setPathSection( ++this.pathIndex );
            }
        }
    },
});