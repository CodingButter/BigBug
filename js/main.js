/**
 * Created by Jamie Nichols on 9/14/2016.
 */
//Define Right away
var secret = {};
//Tuck All of our variables away.
(function() {

    //Control Related
    var keys = [];
    var left = 37;
    var up = 38;
    var right = 39;
    var down = 40;
    var a = 65;
    var s = 83;
    var w = 87;
    var d = 68;
    var shift = 16;
    var enter = 13;

    //Dom
    var dirt = $("#dirt");

    var msg = $("#msg");
    var body = $("body");
    var ranking = $("#ranking");

    //Bug Objects/Arrays
    var me = {}; //define controllable bug
    var bugies = {}; //Holds all bugs (rerence-able by id AKA socketid);
	var candys = [];
	var numOfCandies = 10;
    candidates = [];
	var frameID;
    secret.bugies = bugies;
    var bugarray = []; //Holds all bugs for easy sorting/filtering by properies
    var spawn = {
        x:10000,
        y:10000,
        width:2000,
        height:2000
    };
    var candy_size=50;
    //Set up the camera object
    var camera = {
        fps: 30,
		width:$(window).width(),
		height:$(window).height(),
        offset: {
            x: 0,
            y: 0
        }, //This offset will be used to position everything on the screen
        center: {
            x: this.width / 2,
            y: this.height / 2
        } //this will position the current player bug(me)
    };

    var ranklist;
    var DEFAULTS = {
        position: {
            x: 0,
            y: 0
        },
        width: 100,
        height: 100
    };

	
	
    //SOCKET STUFF
    var socket = io.connect();
    secret.s = socket;
    socket.on('start', init);
    socket.on('force disconnect', forceDisconnect);
    socket.on('bugy added', addBugy);
    socket.on('update a bug', updateBug);
    socket.on('request update', function() {
        if (me) updateMe();
    });

    socket.on('remove bug', function(bugid) {
        removeBug(bugid);
    });

    function updateMe() {
        socket.emit('update bug', me);
    }

    function removeMe() {
        socket.emit('remove bug', me);
    }

    function requestUpdate() {
        socket.emit('request update');
    }

    dirt.on('beforeunload', function() {
        return "Come Back Soon";
    });
    dirt.unload(function() {
        socket.disconnect();
        return "Bye";
    });

    function forceDisconnect(data) {
        $("title").html("Booted");
        $("#msg #status").html("Server Message: " + data.reason);
        $("#msg #fix").html("Fix: " + data.fix);
        msg.show();
        bugies = {};
        me = {};
        $(".entity").remove();
    }
    /*
     * End Socket Stuffs
     */
	 
$(window).resize(function(){
	camera.width = $(window).width();
	camera.height = $(window).height();
})

    function init(server_bugs) {
		camera.center.x = $(window).width()/2;
		camera.center.y = $(window).height()/2;
        me = new bug(spawn.x - spawn.width + Math.random() * (spawn.width * 2), spawn.y - spawn.height + Math.random() * (spawn.height * 2), socket.id,"Guest Buggy");
     
		me.elm.addClass("me");
        secret.me = me;
        bugarray.push(me);
        socket.emit("add bugy", me);


        for (var property in server_bugs) {
            if (server_bugs.hasOwnProperty(property)) {
                addBugy(server_bugs[property]);
            }
        }

        for(i=0;i<numOfCandies;i++){
                    candys.push(new candy(Math.random()*camera.width,Math.random() * camera.height,candy_size,candy_size));
        }
        run();
    }

    function removeBug(bugid) {
        if (bugid != me.id) {
            bugarray.splice(bugarray.indexOf(bugies[bugid]), 1);
            bugies[bugid].elm.remove();
            delete bugies[bugid];
        }
    }

    function addBugy(fdata) {
        if (fdata.id != me.id) {
            bugies[fdata.id] = new bug(fdata.x, fdata.y, fdata.id);
            bugarray.push(bugies[fdata.id]);
            updateBug(fdata);
        }
    }


    function run() {
		var delta = 0;
		var lastFrameTimeMs = 0;
		var lastFpsUpdate = 0;
		var framesThisSecond = 0;
		var fps = camera.fps;
		var timestep = 1000 / fps;
		frameID = requestAnimationFrame(function(timestamp) {
            running = true;
            lastFrameTimeMs = timestamp;
            lastFpsUpdate = timestamp;
            framesThisSecond = 0;
            frameID = requestAnimationFrame(mainLoop);
        });
		
		
		function mainLoop(timestamp) {
			// Throttle the frame rate.    
			if (timestamp < lastFrameTimeMs + (1000 / fps)) {
				frameID = requestAnimationFrame(mainLoop);
				return;
			}
			delta += timestamp - lastFrameTimeMs;
			lastFrameTimeMs = timestamp;


			if (timestamp > lastFpsUpdate + 1000) {
				fps = 0.25 * framesThisSecond + 0.75 * fps;

				lastFpsUpdate = timestamp;
				framesThisSecond = 0;
			}
			framesThisSecond++;

			var numUpdateSteps = 0;
			while (delta >= timestep) {
				tick(timestep);
				delta -= timestep;
				if (++numUpdateSteps >= 240) {
					panic();
					break;
				}
			}
			render();
			frameID = requestAnimationFrame(mainLoop);
		}
		function panic() {
			delta = 0; 
		}
    }
	
    function render() {
        candys.forEach(function(c,i){
            c.render();
        });
		me.render();
        candidates.forEach(function(f,index){
                f.render();
        });
        body.css({
            'background-position-x': (-camera.offset.x) + "px",
            'background-position-y': (-camera.offset.y) + "px"
        });

        dirt.css({
            'background-position-x': -camera.offset.x + "px",
            'background-position-y': -camera.offset.y + "px"
        });
        ranking.html(ranklist);
    }

    function tick(dt) {
        camera.offset.x = me.x - camera.center.x;
        camera.offset.y = me.y - camera.center.y;
		candys.forEach(function(c,i){
            c.tick(dt);
			if (checkCollision(me, c)) {
				me.size+=.01;
				var moveAng = Math.random()*(Math.PI*2);
				c.x = Math.random()* camera.width
				c.y = Math.random() * camera.height;
			}

			
        });
        bugarray = bugarray.sort(function(a, b) {
            if (a.size > b.size) {
                return -1;
            } else if (a.size < b.size) {
                return 1;
            } else {
                return 0;
            }
        });

        ranklist = $("<ul id='ranklist'/>");
        for (var i = 0; i < bugarray.length; i++) {
            var li = $("<li class='item'>" + bugarray[i].name + "</li>");
            if (bugarray[i] !== me) {
                var arrow = $("<div class='arrow'>></div>");
                arrow.css({
                    transform: "rotateZ(" + getAngle(me, bugarray[i]) + "deg)"
                });
                li.append(arrow);
            }
            ranklist.append(li);
        }

        for (var property in bugies) {
            if (bugies.hasOwnProperty(property)) {				
                var f = bugies[property].tick(dt);
            }
        }
		candidates.forEach(function(f,index){
			
			if (me !== f && f.cancollide && me.cancollide) {
				if (Math.floor(f.width) > Math.floor(me.width)) {
					if (checkCollision(me, f)) {
						me.speed = 0;
						me.cancollide = false;
						me.die();
						updateMe();
					}

				}
				if (Math.floor(f.width) < Math.floor(me.width)) {
					if (checkCollision(me, f)) {
						me.size += me.size / 20;
						bugies[f.id].die();
						updateMe();
					}

				}
			}
		});
    }


    //Check collissions
    function checkCollision(a, b) {
        if (a.cancollide && b.cancollide || b.type == "candy") {
            if ((a.width / 2) + (b.width / 2) >= a.getDist(b)) {
                return true;
            }
        }
        return false;
    }

    //Update a buges data
    function updateBug(fd) {

        if (fd.id != me.id) {
            var ubug = bugies[fd.id];
            ubug.x = fd.x;
            ubug.y = fd.y;
            ubug.name = fd.name;
            ubug.width = fd.width;
            ubug.height = fd.height;
            ubug.layer = fd.layer;
            ubug.size = fd.size;
            ubug.speed = fd.speed;
            ubug.accel = fd.accel;
            ubug.cancollide = fd.cancollide;
            ubug.rotation = fd.rotation;
            ubug.rotspeed = fd.rotspeed;
            ubug.friction = fd.friction;
        }
    }


    //Candy Class
    var candy = function(_x,_y){
		this.type ="candy";
        this.elm = $('<div class="dot"></div>');
        var cntr = $('<div class="dot_center"><div class="dot_shadow"></div></div>');
        this.elm.append(cntr);
        dirt.append(this.elm);
        this.x = _x;
        this.y = _y;
        this.width = 50;
        this.height= 50;
        this.elm.css({
            width:this.width+"px",
            height:this.height+"px"
        });
        this.render = function(){
            this.elm.css({
                left:this.x - camera.offset.x,
                top:this.y - camera.offset.y,
				marginLeft: "-" + (this.width / 2) + "px",
                marginTop: "-" + (this.width / 2) + "px",
            });
        }
		this.tick = function(dt){
			
			if(this.x - camera.offset.x < -this.width){
				this.x += camera.width + (this.width*2);
				this.y += -this.height + Math.random() * (this.height * 2);
			}
			if(this.x - camera.offset.x > camera.width + this.width){
				this.x -= camera.width + (this.width*2);
				this.y += -this.height + Math.random() * (this.height * 2);
			}
			if(this.y - camera.offset.y < -this.height){
				this.y += camera.height + (this.height*2);
				this.x += -this.width + Math.random() * (this.width * 2);
			}
			if(this.y - camera.offset.y > camera.height + this.height){
				this.y -= camera.height + (this.height*2);
				this.x += -this.width + Math.random() * (this.width * 2);
			}
			
		}
    };

    //Bug Class
    var bug = function (_x, _y, _id, _name) {
        bugies[_id] = this;
		this.type="bug";
        var T = this;
        this.x = _x;
        this.y = _y;
        this.id = _id;
        this.name = _name || this.name;
		this.rotation = 0;
        this.set = function () {
            this.shrinkrate = .9999;
            this.speed = 0;
            this.rotRate = .1;
            this.friction = 1;
            this.frictionAmt = .97;
            this.rotspeed = 0;
            this.accel = 0;
            this.accelRate = .03;
            this.maxspeed = .4;
			this.maxsize = 2.5;
			this.moveDir = 0;
            this.size = 1;
            this.width = DEFAULTS.width;
            this.height = DEFAULTS.height;
            this.cancollide = false;
            setTimeout(function () {
                T.cancollide = true;
                updateMe();
            }, 10000);

        };
        this.set();
        this.elm = $("<div class='bugy'/>");
        this.elm.on("click", function (e) {
            if (T == me) {
                if (T.inp && e.target != T.inp) {
                    T.name = T.inp.val();
                    T.inp.remove();
                    delete T.inp;
                } else {
                    T.inp = $("<input type='text' class='name' placeholder='bug name'/>");
                    T.inp.on('keydown', function (e) {
                        if (e.which == enter) {
                            T.name = $(this).val();
                            this.remove();
                        }
                    });
                    T.elm.append(T.inp);
                    T.inp.focus();
                }
            }
        });
		
        this.elm.addClass("entity");
        this.elm.attr("title", this.id);
        this.nametip = $("<div class='name'/>");
        this.elm.append(this.nametip);
        this.skin = $("<div class='skin'/>");
        this.elm.append(this.skin);
        dirt.append(this.elm);

        this.getDir = function () {
            return Math.atan2(this.accelY, this.accelX) * 180 / Math.PI;
        };


        this.die = function () {
            if (this == me) {
                this.set();
            }
        };
        //main render
        this.render = function () {
            $("title").html("Big Bug " + bugarray.length);
            if (this.name != '') this.nametip.show();
            else this.nametip.hide();
            if (this.inp) {
                this.inp.css({
                    transform: "rotateZ(" + (-this.rotation) + "deg)"
                })
            }
            this.nametip.css({
                transform: "rotateZ(" + (-this.rotation) + "deg)"
            });
            this.elm.css({
                left: (this.x - camera.offset.x) + "px",
                top: (this.y - camera.offset.y) + "px",
                marginLeft: "-" + (this.width / 2) + "px",
                marginTop: "-" + (this.width / 2) + "px",
                width: this.width + "px",
                height: this.height + "px",
                opacity: (this.cancollide) ? 1 : 0.5,
                transform: "rotateZ(" + this.rotation + "deg)"
            });
            var bg = getBugy(this.size);
            this.skin.css({
                backgroundImage: bg,
                backgroundSize: "100%"
            });
            camera.center.x = camera.width / 2;
            camera.center.y = camera.height / 2;
        };

        //main tick
        this.tick = function (dt) {
            this.rotation += this.rotspeed * dt;
			this.size = (Math.abs(this.maxsize)>this.size)?this.size:this.maxSize;
            this.speed = (Math.abs(this.speed) < this.maxspeed) ? this.speed + this.accel : this.speed;
            this.speed *= this.friction;
            this.nametip.html(this.name);
			this.moveDir -= (this.moveDir - this.rotation)/20;
            this.x +=(Math.cos(this.moveDir* (Math.PI / 180)) * this.speed) * dt;
            this.y += (Math.sin(this.moveDir * (Math.PI / 180)) * this.speed) * dt;
            this.size *= this.shrinkrate;
           // this.size += (this.accel / 60000) * dt;
            this.width = DEFAULTS.width * this.size;
            this.height = DEFAULTS.height * this.size;
            if (this.size < .75) this.die();

            if (this.x - camera.offset.x < camera.width
                && this.x - camera.offset.x > 0
                && this.y - camera.offset.y < camera.height
                && this.y - camera.offset.y > 0) {
                if (candidates.indexOf(this) == -1 && this !== me) {
                    candidates.push(this);
					this.elm.show();
                }
            } else {
                if (candidates.indexOf(this) != -1 && this !== me) {
                    candidates.splice(candidates.indexOf(this), 1);
					this.elm.hide();
                }
            }
        };

        this.getDist = function (ent) {
            var distx = this.x - ent.x;
            var disty = this.y - ent.y;
            return Math.sqrt(distx * distx + disty * disty);
        };

    };

    function getAngle(a, b) {
        var dirX = b.x - a.x;
        var dirY = b.y - a.y;
        return Math.atan2(dirY, dirX) * 180 / Math.PI;
    }

    function getBugy(_s) {
        return "url(./images/lady_bug.png)";
    }

    /*
     * CONTROLS
     */

    //PC CONTROLS
    document.addEventListener('keydown', function(e) {
        if (keys[e.which] != true) {
            keys[e.which] = true;
            if (keys[left] || keys[a]) me.rotspeed = -me.rotRate;
            if (keys[right] || keys[d]) me.rotspeed = me.rotRate;
            if (keys[up] || keys[w]) me.accel = me.accelRate;
            if (keys[down] || keys[s]) me.accel = -me.accelRate;
            if (keys[up] && keys[down] && keys[w] && keys[s]) me.friction = 0;
            updateMe();
        }
    }, 1);

    document.addEventListener('keyup', function(e) {
        keys[e.which] = false;
        if (keys[left] != true && keys[a] != true && keys[right] != true && keys[d] != true) me.rotspeed = 0;
        if (keys[up] != true && keys[w] != true && keys[down] != true && keys[s] != true) me.accel = 0;
        if (keys[up] != true && keys[down] != true && keys[w] != true && keys[s] != true) me.friction = me.frictionAmt;
        updateMe();
    }, 1);

	

})();
