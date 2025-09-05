// import { v7, validate } from 'uuid';

// FOR DEMONSTRATION ONLY

// 1. Nó là Bất biến (Immutable)
// Trạng thái của nó không bao giờ được thay đổi sau khi đã được tạo ra.
// Nếu bạn muốn một giá trị mới, bạn phải tạo ra một object mới.

// 2. Nó được So sánh bằng Giá trị (Value Equality)
// Hai VO được coi là bằng nhau nếu tất cả các thuộc tính bên trong chúng bằng nhau.

// 3. Nó Tự validate (Self-validating)
// Constructor của VO phải là người gác cổng, đảm bảo không một VO không hợp lệ nào có thể được tạo ra.

// export class Id {
//     public readonly value: string;

//     private constructor(value: string) {
//         // Quy tắc 3: Tự validate
//         if (!validate(value)) throw new Error('Invalid UUID format.');
//         this.value = value;

//         // Quy tắc 1
//         Object.freeze(this);
//     }

//     // Quy tắc 2: So sánh bằng giá trị
//     public equals(other: Id): boolean {
//         return this.value === other.value;
//     }

//     // Quy tắc 1
//     public static generate(): Id {
//         return new Id(v7());
//     }

//     // Quy tắc 1
//     public static from(value: string): Id {
//         return new Id(value);
//     }
// }
