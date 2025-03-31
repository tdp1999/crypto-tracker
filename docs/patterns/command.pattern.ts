/* eslint-disable */
/**
 * This is the illustration of command pattern
 * https://refactoring.guru/design-patterns/command
 * */

/**
 * Dan nhap:
 * Command Pattern là một pattern dùng để cắt đứt mối liên hệ giữa invoker (caller) và receiver. Cụ thể, nó "đóng gói" lời gọi hàm của invoker thành một class riêng biệt, khiến cho việc gọi hàm trở nên transferable, queueable, và nổi bật hơn cả, undoable.

Cắt đứt mối liên hệ,.... Hmm, nghe thì có vẻ tương tự như Strategy Pattern (do cùng một ý thức hệ của [Dependency inversion principle - Wikipedia](https://en.wikipedia.org/wiki/Dependency_inversion_principle), chữ D trong SOLID), nhưng sự khác biệt là rất lớn. Nó dựa vào intent của 2 pattern.

---
Ta hãy hình dung như sau:
Class A cần sử dụng feature (method) x của class B.
Lẽ thường, B sẽ phải `const a = new A(...)` ở đâu đó, sau đó `a.x(...)`.

 Nếu ta sử dụng Strategy, thì sẽ trở thành:
 B sẽ declare trong constructor của mình một dependency có shape là IA:
 `constructor(private a: IA)`, sau đó B vẫn gọi  `a.x(...)`.
 Công việc thật sự là ở runtime, khi client quyết định IA là cái gì. Nó có thể là A `class A implement IA`, hoặc có thể là A1, `class A implement IA`. Khi khởi tạo B, client cần quyết định là A hay A1 mà inject vào B.

Còn ở trường hợp Command:
Ta cần viết một interface là ICommand: `interface ICommand { execute(); undo(); }`, sau đó viết một command C hoặc một số các command C1, C2 implement ICommand.
C, C1, C2 có trong constructor A, và các param cần thiết cho việc invoke A:
`constructor(private a: A, private param: unknown)`.
Cùng với đó, C1, C2, C bản thân phải implement logic có dùng A: `a.x(param)`.
Cuối cùng là ở B, B sẽ quyết định xem sẽ sử dụng C, C1, C2 như thế nào.
B sẽ cần 1, hoặc nhiều C bên trong constructor của mình: `constructor(private c: ICommand, private c1: ICommand)`
B có thể implement một stack, trong đó sau khi execute C `c.execute()`, B quăng C vào stack. Sau đó nếu cần, B có undo C bằng cách lôi nó ra từ stack `c.undo()`.
Phần này sẽ được giải thích rõ hơn bên dưới.

---
Ta thấy đó, với cùng một problem, cách giải quyết của Command và Strategy là hoàn toàn khác nhau. Ta quay lại với intent của Command:

    turns a request into a stand-alone object that contains all information about the request
Keyword ở đây là: standalone, contain all information.

Command Pattern là nền tảng (foundation) của nhiều big pattern/architecture như  CQRS hay Event Sourcing. Dĩ nhiên, thực tế sẽ thay đổi nhiều so với bản gốc command pattern, nhưng the gist, bản chất tách rời request để có thể handle với stack, queue vẫn không thay đổi.

---

 * */

/**
 * 0. Prerequisite - Receiver. Co san 1 receiver, noi thuc hien logic thuc te
 * */
class Value {
    private _value: number;

    constructor(value: number) {
        this._value = value;
    }

    get value() {
        return this._value;
    }

    add(operand: number) {
        this._value += operand;
    }

    subtract(operand: number) {
        this._value -= operand;
    }

    multiply(operand: number) {
        this._value *= operand;
    }

    divide(operand: number) {
        if (operand === 0) {
            throw new Error('Cannot divide by zero');
        }
        this._value /= operand;
    }
}

/**
 * 1. Command Interface. Thuc te ta co the thay the interface bang abstract class.
 * */

interface ICommand {
    execute(): void;
    undo(): void;
}

/**
 * 2. Command Implementation
 * Cac implementation/Concrete Command. nhung class nay self-contained, khi trigger execute, khong nhan vao bat cu tham so nao.
 * Thay vao do, cac thong tin can thiet se duoc declare nhu field, init trong constructor. => DAY LA DIEM COT YEU CUA COMMAND PATTERN
 * execute() trigger Receiver.
 * */

class AddCommand implements ICommand {
    constructor(
        private value: Value,
        private operand: number,
    ) {}

    execute() {
        this.value.add(this.operand);
    }

    undo() {
        this.value.subtract(this.operand);
    }
}

class SubtractCommand implements ICommand {
    constructor(
        private value: Value,
        private operand: number,
    ) {}

    execute() {
        this.value.subtract(this.operand);
    }

    undo() {
        this.value.add(this.operand);
    }
}

class MultiplyCommand implements ICommand {
    constructor(
        private value: Value,
        private operand: number,
    ) {}

    execute() {
        this.value.multiply(this.operand);
    }

    undo() {
        this.value.divide(this.operand);
    }
}

class DivideCommand implements ICommand {
    constructor(
        private value: Value,
        private operand: number,
    ) {}

    execute() {
        this.value.divide(this.operand);
    }

    undo() {
        this.value.multiply(this.operand);
    }
}

/**
 * 3. Invoker.
 * Day la noi luu tru instance cua nhung concrete command. Day cung la noi quyet dinh xu ly nhung command nao, va thu tu xu ly nhung command do.
 * Ta co the implement 1 stack  (queue, list, ...) o day
 * */

class Calculator {
    private stack: ICommand[] = [];

    executeCommand(command: ICommand) {
        this.stack.push(command);
        command.execute();
    }

    unexecuteCommand() {
        const command = this.stack.pop();
        if (command) {
            command.undo();
        }
    }
}

/**
 * 4. Client.
 * */

const value = new Value(10);
const calculator = new Calculator();

const addCommand = new AddCommand(value, 1);
calculator.executeCommand(addCommand);
console.log(value.value); // -> 11

const subtractCommand = new SubtractCommand(value, 1);
calculator.executeCommand(subtractCommand);
console.log(value.value); // -> 10

calculator.unexecuteCommand();
console.log(value.value); // -> 11

calculator.unexecuteCommand();
console.log(value.value); // -> 10

/*
 * Gia su o 1 noi nao do can su dung cac operation command tren, ta co the su dung nhu sau:
 */

class Operation {
    constructor(private calculator: Calculator) {}

    executeCommand(command: ICommand) {
        this.calculator.executeCommand(command);
    }
}

const operation = new Operation(calculator);
operation.executeCommand(addCommand);
operation.executeCommand(subtractCommand);

/*
 * Trong thuc te, command pattern khong han la decoupling command va client,
 * No decoupling command va receiver.
 *
 * Client van phai biet chon command nao de execute (Tuong tu Strategy Pattern).
 *
 * Dieu quan trong o day la:
 * - Ta bao goi command (thuong la mot loi goi ham), tro thanh 1 object -> Store no trong stack, queue, ...
 * - Co the reuse logic cua command khi co nhieu client. ???
 */

/*
 * End
 */
