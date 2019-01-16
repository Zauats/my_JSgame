'use strict';

class Vector {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	plus(vector) {
		if (!(vector instanceof Vector)) {
			throw new Error('Можно прибавлять к вектору только вектор типа Vector')	
		}
		return new Vector(this.x + vector.x, this.y + vector.y)
	}

	times(factor) {
		return new Vector(this.x * factor, this.y * factor);
	}
}


class Actor {
	constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {

    if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
      throw new Error('Здесь нужен объект типа Vector');
    }

    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }

	act() {}

	get left() {
		return this.pos.x;
	}
	get top() {
		return this.pos.y;
	}
	get right() {
		return this.pos.x + this.size.x;
	}
	get bottom() {
		return this.pos.y + this.size.y;
	}
	get type() {
		return "actor";
	}

	isIntersect(actor) {
		if (actor === this) {
			return false;
		}
		if (!(actor instanceof Actor) || actor === undefined) {
			throw new Error("Нужно передать объект типа Actor")
		}
		if ((this.left >= actor.right) || (this.right <= actor.left) || (this.top >= actor.bottom) || (this.bottom <= actor.top)) {  //вопросик. Почему формула такая?? Нужно будет нарисовать модельку 
			return false
		}
		return true
	}
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid
    this.actors = actors
    this.height = grid.length
    this.width = Math.max(0, ...grid.map(string => string.length))
    this.status = null
    this.finishDelay = 1
    this.player = actors.find(actor => actor.type === "player")
  }

  isFinished() {
    return (this.status !== null) && (this.finishDelay < 0)
  }

  actorAt(actor) {
    if ((actor === undefined) || !(actor instanceof Actor)) {
      throw new Error("Передайте объект типа Actor")
    }
    if (this.actors.length < 2) {
      return undefined
    }else{
      return this.actors.find(function(item) {return item.isIntersect(actor)})
    }
  }

  obstacleAt(pos, size) {
    if (!(pos instanceof Vector) || !(size instanceof Vector)) {
      throw new Error("Нужно передать объект типа Vector")
    }

    let top = Math.floor(pos.y)
    let right = Math.ceil(pos.x + size.x)
    let bottom = Math.ceil(pos.y + size.y)
    let left = Math.floor(pos.x)
    
    if (bottom > this.grid.length) {
      return('lava')
    }else if (left < 0 || top < 0 || right > this.grid.length) {
      return 'wall'
    }
    for (let y = top; y < bottom; y++) {
      for (let x = left; x < right; x++) {
        if (this.grid[y][x] !== undefined) {
          return this.grid[y][x]
        }

      }
    }
    return  undefined
  }

  removeActor(actor) {
    if (this.actors.includes(actor)){
      this.actors.splice(this.actors.indexOf(actor), 1)
    }
  }

  noMoreActors(type) {
    for (let actor of this.actors) {
      if (type === actor.type) {
        return false
      }
    }
    return true
  }

  playerTouched(typeObject, actor) {
    if (this.status === null) {
      if (typeObject === 'lava' || typeObject === 'fireball') {
        this.status = 'lost'
      }else if (typeObject === 'coin' && actor.type === 'coin') {
        this.removeActor(actor)
      };
      if (this.noMoreActors(actor) && typeObject === 'coin') {
        this.status = 'won'
      }
    }
  }
}

class LevelParser {
  constructor(movingObjects) {
    this.movingObjects = movingObjects
  }

  actorFromSymbol(simbol) {
    if (simbol !== undefined && simbol in this.movingObjects) {
      return this.movingObjects[simbol]
    }
    return undefined
  }

  obstacleFromSymbol(simbol) {
    if (simbol === 'x') {
      return 'wall'
    }else if (simbol === '!'){
      return 'lava'
    }else{
      return undefined
    }
  }

  createGrid(stringList) {
    let index = 0, levelList = []

    for (let string of stringList) {
      levelList.push([])
      for (let simbol of string) {
        levelList[index].push(this.obstacleFromSymbol(simbol))
      }
      index++
    }
    return levelList
  }

  createActors(stringList) {
      var actorList = []
      var y = 0
      for (let string of stringList) {
        var x = 0
        for (let simbol of string) {
          var actor = this.movingObjects[simbol]

          if ((typeof actor === 'function' && new actor instanceof Actor)) {
            actorList.push(new actor(new Vector(x, y)));
          }
          x++
        }
        y++
      }
      return actorList
  }

  parse(stringList) {
    return new Level(this.createGrid(stringList), this.createActors(stringList))
  }
}


class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(pos, new Vector(1, 1), speed)
  }
  get type() {
    return 'fireball'
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time))
  }

  handleObstacle() {
    this.speed =  this.speed.times(-1)
  }

  act(time, level) {
    let newPos = this.getNextPosition(time)
    if (level.obstacleAt(newPos, this.size) !== undefined) {
      this.handleObstacle()
      
    }else {
      this.pos = newPos
    }
    
  }
}


class HorizontalFireball extends Fireball{
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(2, 0))
  }
}

class VerticalFireball extends Fireball{
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(0, 2))
  }
}

class FireRain extends Fireball{
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(0, 3))
    this.firstPos = pos
  }

  handleObstacle() {
    this.pos = this.firstPos;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6))
    this.springSpeed = 8
    this.springDist = 0.07
    this.spring = Math.random() * (2 * Math.PI)
    this.originalPos = this.pos
  }

  get type() {
    return 'coin'
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist)
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.originalPos.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time)
  }
}


class Player extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5), new Vector(0, 0))
  }
  get type() {
    return 'player'
  }
}

