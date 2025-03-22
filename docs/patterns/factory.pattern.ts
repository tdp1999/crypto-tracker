/* eslint-disable */
/**
 * This is the illustration of multiple factory patterns
 * https://refactoring.guru/design-patterns/factory-method
 * https://refactoring.guru/design-patterns/factory-comparison
 * */

/*
 * Factory Pattern là một tên gọi chung của rất nhiều kỹ thuật code và pattern khác nhau,
 * nhưng chúng có một điểm chung là giá trị trả về của những class áp dụng pattern này, là một instance/object.
 * */

/*
 * 1. Ta cần thống nhất một điểm như sau:
 * Tất cả những đoạn code hoặc function có mục đích là create một new instance, thì được gọi là creation method.
 * Nói cách khác, creation method là một cách mà ta wrap dòng new instance bên trong một hàm nào đó.
 * Ví dụ như bên dưới. Hàm update là một creation method.
 * */

// @ts-ignore
export class Address {
    readonly country: string;
    readonly stateOrProvince: string; // State, province, or region
    readonly city: string; // City or town
    readonly address: string; // Street address
    readonly updatedById: string;

    constructor(props: Record<string, any>) {
        Object.assign(this, props);
    }

    public update(data: Record<string, any>) {
        const newData = { ...this, ...data, updatedById: 'me' };
        return new Address(newData);
    }
}

/*
 * Creation Method không phải là một pattern. Nó là một dạng code idiom.
 * */

/*
 * 2. Tiếp đến, ta có static creation method. Static creation method là một method/function bên trong một class
 * dùng để tạo ra chính instance của class đó.
 * Sử dụng class address ở trên, ta thêm vào (phần bị comment):
 * */

// @ts-ignore
export class Address {
    readonly country: string;
    readonly stateOrProvince: string; // State, province, or region
    readonly city: string; // City or town
    readonly address: string; // Street address
    readonly updatedById: string;

    constructor(props: Record<string, any>) {
        Object.assign(this, props);
    }

    public update(data: Record<string, any>) {
        const newData = { ...this, ...data, updatedById: 'me' };
        return new Address(newData);
    }

    // // Static Creation Method, read this: https://refactoring.guru/design-patterns/factory-comparison (header 3)
    // static fromJSON(rawAddress: IAddress, user: SharedUser) {
    //     const { success, error, data } = AddressSchema.safeParse(rawAddress);
    //
    //     if (!success)
    //         throw BadRequestError(formatZodError(error), { remarks: 'Constructing address from json failed' });
    //
    //     const now = TemporalValue.getNow();
    //
    //     return new Address({
    //         ...data,
    //         id: v7(),
    //         createdAt: now,
    //         createdById: user.id,
    //         updatedAt: now,
    //         updatedById: user.id,
    //     });
    // }
    //
    // // Static Creation Method
    // static fromPersistence(data: IAddress) {
    //     return new Address(data);
    // }
}

/*
 * Đây cũng chẳng phải là một factory pattern, đây cũng là một code idiom, thường dùng khi trong một class cần nhiều
 * cách để init một instance, như ở ví dụ address, ta có 2 môi trường cần dùng address, 1 môi trường tạo mới hoàn toàn (JSON) -> cần logic khởi tạo,
 * và một môi trường chỉ copy data đã có sẵn, không cần khởi tạo.
 * */

/*
 * 3. Simple Factory Patternn (Simple).
 * Đây gần như, GẦN NHƯ là một pattern rồi. Đây là pattern mà mình dùng cho CacheFactory:
 * */

/*
* export class CacheFactory {
    static createCacheService<T extends Identifiable>(
        type: 'memory' | 'redis',
        repository: CacheRepository<T>,
        options: CacheOptions = {},
        // redis?: Redis,
    ): CacheService<T> {
        switch (type) {
            case 'memory':
                return new MemoryCacheService<T>(repository, options);
            case 'redis':
                // if (!redis) {
                //     throw new Error('Redis client is required for redis cache service');
                // }
                return new RedisCacheService<T>(repository, options);
            default:
                throw new Error(`Unsupported cache type: ${type}`);
        }
    }
}
* */

/*
 * Khi ta không biết trước được có bao nhiêu dạng instance, ta cần gom logic creation lại vào trong một chỗ, thì đó là
 * chỗ của Factory Method. Vậy, cái này thì giúp được gì?
 * Giả sử ta không sử dụng bất cứ factory pattern nào cả, cứ create thẳng instance bên trong client code (new Instance),
 * 1. Nó chỉ thích hợp khi ta không phải if/else new instance, tức chỉ có 1 instance. Nếu ta introduce thêm 1 instance khác,
 *   như trường hợp trên, thêm redis vào cache strategy, ta sẽ phải thay đổi code của client.
 * 2. Giả sử ta có thể if/else trong client code, thì những logic if/else này sẽ lặp đi lặp lại ở tất cả những chỗ cần instance cache
 *  -> Code duplication, đặc biệt là với trường hợp logic if/else trở nên phức tạp
 * 3. Ta đã vi phạm nguyên tắc của Dependency injection, để cho client tự init instance.
 *
 * Tuy vậy, simple factory method chỉ sử dụng khi ta chỉ cần đúng 1 logic để decide instance nào được tạo, ví dụ như dùng type.
 * */

/*
 * 4. Factory Method Pattern.
 * Factory Method được sinh ra là để khái quát hóa simple factory method ở trên. Đây là một pattern trong GoF.
 * Khi ta cần nhiều hơn 1 loại logic để tạo ra instance, ta phải sử dụng factory method.
 * Ta hãy dùng 1 ví dụ mới.
 * */

export interface Animal {
    name: string;
    age: number;
}

export class Dog implements Animal {
    constructor(
        public name: string,
        public age: number,
    ) {}

    bark() {
        console.log(`${this.name} barks!`);
    }
}

export class Cat implements Animal {
    constructor(
        public name: string,
        public age: number,
    ) {}

    meow() {
        console.log(`${this.name} meows!`);
    }
}

/*
 * Nếu dùng simple, ta chỉ cần một class, như bên dưới
 * */
export class AnimalSimpleFactory {
    static createAnimal(type: 'dog' | 'cat', name: string, age: number): Animal {
        switch (type) {
            case 'dog':
                return new Dog(name, age);
            case 'cat':
                return new Cat(name, age);
            default:
                throw new Error(`Unsupported animal type: ${type}`);
        }
    }
}

/*
 * Tuy nhiên, giả sử ta cần thêm một factory và sử dụng random để return một instance thì sao?
 * Dưới đây là thứ mà ta cần
 * */
export interface AnimalFactory {
    createAnimal(name: string, age: number): Animal;
}

export class RandomAnimalFactory implements AnimalFactory {
    createAnimal(name: string, age: number): Animal {
        const randomType = Math.random() > 0.5 ? 'dog' : 'cat';
        if (randomType === 'dog') {
            return new Dog(name, age);
        } else {
            return new Cat(name, age);
        }
    }
}

export class BalancedAnimalFactory implements AnimalFactory {
    private count = 0;

    createAnimal(name: string, age: number): Animal {
        this.count += 1;
        if (this.count % 2 === 0) {
            return new Dog(name, age);
        } else {
            return new Cat(name, age);
        }
    }
}

/*
* Factory Method pattern không phức tạp hóa factory pattern lên, nó áp dụng cho một dạng bài toán cụ thể, thứ mà simple không làm được.
* */

/*
* 5. Abstract Factory Pattern.
* Đây là một dạng nâng cao hơn của Factory Method Pattern. Nó được xây dựng dựa trên factory method pattern.
* Thực tế, sự khác biệt đáng kể nhất giữa 2 pattern này chính là:
* Factory Method pattern có thể construct 1 instance/object (có duy nhất 1 method createProduct trong interface)
* Abstract Factory Pattern có thể construct nhiều instance/object (có nhiều 1 method createProduct trong interface). Mà trong đó
*   các instance/object được tạo ra phải make sense với nhau trong ngữ cảnh đó.
*
* Mình không đi sâu vào pattern này, vì mình chưa thấy trường hợp sử dụng của nó.
* */
