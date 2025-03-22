/* eslint-disable */
/**
 * This is the illustration of decorator pattern
 * https://refactoring.guru/design-patterns/decorator
 * */

/*
 * 1. The component declare the common interface for both wrapper and wrapped object.
 * */
interface IData {
    name: string;
}

interface IDataSource {
    writeData(data: IData): void;

    readData(): IData;
}

/*
 * 2. Concrete Components (Base Component) is a class of objects being wrapped. It defines basic behavior,
 * which can be altered by decorators.
 * Đây là những class entry, dùng để cho người dùng (main) init data, vì các decorator phải nhận vào 1 base class thế này.
 * */
class FileDataSource implements IDataSource {
    constructor(private fileName: string) {}

    writeData(data: IData) {
        console.log(`Writing data ${JSON.stringify(data)} to ${this.fileName}`);
    }

    readData(): IData {
        console.log(`Reading data from ${this.fileName}`);
        return { name: 'John Doe' };
    }
}

class DatabaseDataSource implements IDataSource {
    constructor(private databaseName: string) {}

    writeData(data: IData) {
        console.log(`Writing data ${JSON.stringify(data)} to database ${this.databaseName}`);
    }

    readData(): IData {
        console.log(`Reading data from database ${this.databaseName}`);
        return { name: 'John Doe' };
    }
}

/*
 * 3. The Base Decorator class has a field for referencing a wrapped object.
 * The field's type should be declared as the component interface so it can contain both concrete components and decorators.
 * The base decorator delegates all operations to the wrapped object.
 * Tất cả những decorator trong decorator pattern đều phải extends từ decorator gốc này.
 * */
class DataSourceDecorator implements IDataSource {
    constructor(private dataSource: IDataSource) {}

    writeData(data: IData) {
        this.dataSource.writeData(data);
    }

    readData(): IData {
        return this.dataSource.readData();
    }
}

/*
 * 4. Concrete Decorators define extra behaviors that can be added to the components dynamically.
 * Concrete decorators override methods of the base decorator and execute their behavior either before or after calling the parent method.
 */
class EncryptDataSource extends DataSourceDecorator {
    writeData(data: IData) {
        const encryptedData = { ...data, name: 'Encrypted ' + data.name };
        super.writeData(encryptedData);
    }

    readData(): IData {
        const data = super.readData();
        return { ...data, name: 'Encrypted ' + data.name };
    }
}

class CompressDataSource extends DataSourceDecorator {
    writeData(data: IData) {
        const compressedData = { ...data, name: 'Compressed ' + data.name };
        super.writeData(compressedData);
    }

    readData(): IData {
        const data = super.readData();
        return { ...data, name: 'Compressed ' + data.name };
    }
}

/*
 * 5. The client can wrap components in multiple layers of decorators,
 * as long as it works with all object via the common interface.
 * Dưới đây là một ví dụ cho cách sử dụng decorator pattern SAI.
 * Để sử dụng đúng decorator pattern, ta cần sử dụng chúng với 1 creational pattern (factory, dependency injection).
 * */
function main() {
    const fileDataSource = new FileDataSource('example.txt');
    const encryptDataSource = new EncryptDataSource(fileDataSource);
    const compressDataSource = new CompressDataSource(encryptDataSource);
    compressDataSource.writeData({ name: 'John Doe' });
    compressDataSource.readData();
}

/*
 * Summary: Decorator ở typescript nên được xem như là một giải pháp technical của typescript hơn là một implementation design pattern.
 * Thay vào đó, middleware của Nestjs có thể xem là một dạng implementation của decorator pattern.
 *
 * Khi nào thì sử dụng decorator pattern:
 * - Khi ta đã sử dụng factory pattern
 * - Khi ta cần extends logic của một class, mà không cần sử dụng inheritance.
 * */
