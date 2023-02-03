// @ts-nocheck
var Vector2: any = function Vector2(x?: number, y?: number) {
    this.x = x || 0;
    this.y = y || 0;
};

Object.assign(Vector2.prototype, {
    set: function (x, y) {
        this.x = x;
        this.y = y;
        return this;
    },

    setScalar: function (scalar) {
        this.x = scalar;
        this.y = scalar;
        return this;
    },

    setVector: function (v) {
        this.x = v.x || 0;
        this.y = v.y || 0;
        return this;
    },

    clone: function () {
        return new this.constructor(this.x, this.y, this.z);
    },

    add: function (v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    },

    addScalar: function (s) {
        this.x += s;
        this.y += s;
        return this;
    },

    sub: function (v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    },

    multiply: function (v) {
        this.x *= v.x;
        this.y *= v.y;
        return this;
    },

    divide: function (v) {
        this.x /= v.x;
        this.y /= v.y;
        return this;
    },

    sum: function () {
        return this.x + this.y;
    },

    equals: function (v) {
        return ((v.x === this.x) && (v.y === this.y));
    }
});

export default Vector2