/* eslint-disable */
/**
 * This is the illustration of adapter pattern
 * https://refactoring.guru/design-patterns/adapter
 * */

/**
 * Dan nhap:
 * Adapter Pattern là một pattern dùng để kết nối 2 nguồn resource A - B không liên quan, chứa 2 kiểu dữ liệu khác nhau (IA, IB), tạo cho chúng một cầu nối để A sử dụng B, hoặc ngược lại.

Nếu đã biết về Hexagonal Architecture, ta sẽ thấy Adapter Pattern được sử dụng dominantly ở tầng infrastructure, như hình:
![080 - Explicit Architecture.svg](https://herbertograca.com/wp-content/uploads/2018/11/080-explicit-architecture-svg.png?w=1100)

Một trong những ứng dụng cơ bản nhất của Adapter Pattern là: Định nghĩa 1 interface chung cho 1 tập các solution third party.
Ví dụ: ta cần integrate một third party API để get danh sách các đồng coin có trên thị trường. Ta có nhiều sự lựa chọn:
- CoinGecko
- CoinMarketCap
- CryptoRank
Mỗi API provider có một cách define token riêng, api endpoint riêng, interface trả về cũng riêng (Strategy Pattern). Ta lại mong muốn đoạn code của mình có khả năng thay đổi API một cách dễ dàng, không phụ thuộc vào third party. Đây chính xác là công dụng của Adapter Pattern.

Như ví dụ trên, cách nhận biết dễ dàng nhất trường hợp sử dụng pattern này là khi ta (client role) có trong tay nhiều sự lựa chọn third party (có thể là API, library, ...), và ta mong muốn chỉ phải deal với 1 interface chung nhất.

*/

/**
 * 1. (Entity Interface) Trong domain layer, tạo một interface đơn nhất, dùng cho client
 * */

interface IProviderAsset {
    id: string;
    name: string;
    symbol: string;
    price: number;
}

/**
 * 2. (Client Interface) Trong application layer, tạo ra một interface, trong đó sử dụng entity interface ở trên
 * */
interface IProviderService {
    getAssets(): Promise<IProviderAsset[]>;
}

/**
 * 3. (Adaptee / Adaptee Interface) Trong infrastructure layer, tạo interface/interfaces dùng để định nghĩa giá trị trả về của Adaptee
 * */
interface CoinGeckoAsset {
    asset_id: number;
    asset_name: string;
    asset_symbol: string;
    asset_price: number;
}

/**
 * 4. (Adapter) Trong infrastructure layer, tạo class/classes, implement Client Interface, chứa adaptee (trường hợp API thì không có adaptee).
 * */
class CoinGeckoProvider implements IProviderService {
    async getAssets(): Promise<IProviderAsset[]> {
        const response = await fetch(
            'https://api.coingecko.com/api/v3/coins/markets?vs_currencies=usd&order=market_cap_by_total_volume&per_page=100&page=1&sparkline=false&price_change_percentage=24h&locale=en',
        );
        const data = await response.json();
        return this._transformData(data);
    }

    private _transformData(data: CoinGeckoAsset[]): IProviderAsset[] {
        return data.map((item: CoinGeckoAsset) => ({
            id: item.asset_id.toString(),
            name: item.asset_name,
            symbol: item.asset_symbol,
            price: item.asset_price,
        }));
    }
}

/**
 * 5. Để sử dụng adapter, ta chỉ cần tạo một Injection Token trả về instance implement client interface
 * */
export const PROVIDER = 'PROVIDER';
