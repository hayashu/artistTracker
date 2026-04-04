interface Node<T>{
    key: string;
    value: T;
    prev: Node<T> | null;
    next: Node<T> | null;
}

export class LRUCache<T>{
    capacity: number;
    head : Node<T>;
    tail : Node<T>;
    map : Map<string, Node<T>>;
    constructor(capacity: number){
        this.capacity = capacity;
        this.map = new Map();
        this.head = {
            key: "head",
            value: undefined as unknown as T,
            prev: null,
            next: null
        }
        this.tail = {
            key: "tail",
            value: undefined as unknown as T,
            prev: null,
            next: null
        }
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }
    get(key: string): T | undefined{
        const getNode = this.map.get(key);
        if (!getNode) return undefined
        this.remove(getNode);
        this.addToHead(getNode);
        return getNode.value;
    }
    private remove(node: Node<T>): void {
        node.prev!.next = node.next;
        node.next!.prev = node.prev;
    }

    private addToHead(node: Node<T>): void {
        node.next = this.head.next;
        this.head.next!.prev = node
        node.prev = this.head;
        this.head.next = node;
        
    }
    // 値がすでにあれば、値を更新し、先頭に持ってくる
    // 値がなければ、キャパシティの限界を見て、先頭に追加
    put(key: string, value: T): void {
        const node = this.map.get(key);
        if (!node){
            const newNode = {
                key: key,
                value: value,
                prev: null,
                next: null
            }
            this.map.set(key, newNode);
            this.addToHead(newNode);
            if (this.capacity < this.map.size){
                const lastNode = this.tail.prev!;
                this.remove(lastNode);
                this.map.delete(lastNode.key);
            }
        }else{
            node.value = value;
            this.remove(node);
            this.addToHead(node);
        }
    }
}



