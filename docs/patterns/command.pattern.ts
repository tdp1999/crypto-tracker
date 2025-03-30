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
 * 1. (Command Interface) Trong domain layer, tạo một interface đơn nhất, dùng cho client
 * */

interface ICommand {
    execute(): void;
    undo(): void;
}
