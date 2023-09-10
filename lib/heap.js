class Heap {
    #value = [];
    #comparator = (x, y) => x - y;
    constructor(comparator = (x, y) => x - y) {
        this.#value = []; this.#comparator = (i, j) => comparator(this.#value[i], this.#value[j]);
    }
    get size() { return this.#value.length; }
    #swap(i, j) { [this.#value[i], this.#value[j]] = [this.#value[j], this.#value[i]]; }

    top() { return this.#value[0]; }
    push(x) {
        this.#value.push(x);
        let id = this.size - 1;
        const Parent = i => Math.ceil(i / 2 - 1);
        while (Parent(id) >= 0 && this.#comparator(Parent(id), id) > 0)
            this.#swap(Parent(id), id), id = Parent(id);
    }
    pop() {
        this.#swap(this.size - 1, 0);
        const deleteValue = this.#value.pop();
        let id = 0;
        const LeftChild = i => i * 2 + 1;
        const RightChild = i => i * 2 + 2;
        const TopChild = i => RightChild(i) < this.size &&
            this.#comparator(LeftChild(i), RightChild(i)) > 0 ? RightChild(i) : LeftChild(i);
        while (LeftChild(id) < this.size && this.#comparator(id, TopChild(id)) > 0) {
            const next = TopChild(id);
            this.#swap(id, next), id = next;
        }
        return deleteValue;
    }
}

class MinHeap extends Heap {
    constructor() { super((x, y) => x - y); }
}
class MaxHeap extends Heap {
    constructor() { super((x, y) => y - x); }
}

module.exports = { Heap, MinHeap, MaxHeap };