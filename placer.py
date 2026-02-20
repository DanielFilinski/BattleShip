import random

ROWS = 9
COLS = 10
ROW_LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И']

ITEMS = [
    ('ship1', 4, 'Линкор'),
    ('ship2', 3, 'Крейсер'),
    ('ship3', 2, 'Эсминец 1'),
    ('ship4', 2, 'Эсминец 2'),
    ('ship5', 1, 'Подлодка 1'),
    ('ship6', 1, 'Подлодка 2'),
    ('ship7', 1, 'Подлодка 3'),
    ('ship8', 1, 'Подлодка 4'),
    ('bomb1', 1, 'Бомба 1'),
    ('bomb2', 1, 'Бомба 2'),
    ('bomb3', 1, 'Бомба 3'),
    ('bomb4', 1, 'Бомба 4'),
]

def cell_label(r, c):
    return f"{ROW_LETTERS[r]}{c + 1}"

def get_cells(r, c, size, horizontal):
    if horizontal:
        return [(r, c + i) for i in range(size)]
    else:
        return [(r + i, c) for i in range(size)]

def get_blocked(cells):
    """Returns the set of cells that must remain empty (neighbors including diagonals)."""
    blocked = set()
    occupied = set(cells)
    for (r, c) in cells:
        for dr in [-1, 0, 1]:
            for dc in [-1, 0, 1]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < ROWS and 0 <= nc < COLS:
                    if (nr, nc) not in occupied:
                        blocked.add((nr, nc))
    return blocked

def solve():
    grid = {}       # cell -> item_id
    blocked = {}    # cell -> set of item_ids that block it
    placement = {}  # item_id -> list of cells

    def add_item(item_id, cells):
        for cell in cells:
            grid[cell] = item_id
        for cell in get_blocked(cells):
            if cell not in blocked:
                blocked[cell] = set()
            blocked[cell].add(item_id)
        placement[item_id] = cells

    def remove_item(item_id, cells):
        for cell in cells:
            del grid[cell]
        for cell in get_blocked(cells):
            if cell in blocked:
                blocked[cell].discard(item_id)
                if not blocked[cell]:
                    del blocked[cell]
        del placement[item_id]

    def can_place(cells):
        for cell in cells:
            r, c = cell
            if r < 0 or r >= ROWS or c < 0 or c >= COLS:
                return False
            if cell in grid:
                return False
            if cell in blocked:
                return False
        return True

    def backtrack(idx):
        if idx == len(ITEMS):
            return True
        item_id, size, name = ITEMS[idx]
        # Try all positions and orientations
        orientations = [True, False] if size > 1 else [True]
        positions = [(r, c) for r in range(ROWS) for c in range(COLS)]
        # Shuffle for variety
        random.shuffle(positions)
        for horizontal in orientations:
            for (r, c) in positions:
                cells = get_cells(r, c, size, horizontal)
                if can_place(cells):
                    add_item(item_id, cells)
                    if backtrack(idx + 1):
                        return True
                    remove_item(item_id, cells)
        return False

    random.seed(42)
    success = backtrack(0)
    return success, placement

def print_grid(placement):
    # Build display grid
    display = [['.' for _ in range(COLS)] for _ in range(ROWS)]
    item_symbols = {}
    # Assign symbols
    ship_sym = ['L', 'C', 'D', 'E', 'P', 'Q', 'R', 'S']
    bomb_sym = ['B', 'b', 'X', 'x']
    si, bi = 0, 0
    for item_id, size, name in ITEMS:
        if item_id.startswith('ship'):
            item_symbols[item_id] = ship_sym[si]; si += 1
        else:
            item_symbols[item_id] = bomb_sym[bi]; bi += 1

    for item_id, cells in placement.items():
        sym = item_symbols[item_id]
        for (r, c) in cells:
            display[r][c] = sym

    # Header
    print("     " + "  ".join([f"{i+1:2}" for i in range(COLS)]))
    print("    +" + "---" * COLS + "+")
    for r in range(ROWS):
        row_str = "  ".join(display[r])
        print(f"  {ROW_LETTERS[r]} | {row_str} |")
    print("    +" + "---" * COLS + "+")
    print()
    # Legend
    for item_id, size, name in ITEMS:
        print(f"  {item_symbols[item_id]} = {name} ({item_id})")

def print_table(placement):
    print()
    print(f"{'Объект':<18} {'ID':<8} {'Клетки'}")
    print("-" * 60)
    for item_id, size, name in ITEMS:
        cells = placement[item_id]
        cells_sorted = sorted(cells, key=lambda x: (x[0], x[1]))
        cell_labels = ", ".join(cell_label(r, c) for r, c in cells_sorted)
        print(f"{name:<18} {item_id:<8} {cell_labels}")

def validate(placement):
    print()
    print("=== ВАЛИДАЦИЯ ===")
    conflicts = []
    item_cells = {item_id: set(cells) for item_id, cells in placement.items()}
    item_ids = list(placement.keys())
    
    for i in range(len(item_ids)):
        for j in range(i + 1, len(item_ids)):
            id_a = item_ids[i]
            id_b = item_ids[j]
            cells_a = item_cells[id_a]
            cells_b = item_cells[id_b]
            # Check if any cell from a is adjacent (including diagonal) to any cell from b
            for (ra, ca) in cells_a:
                for (rb, cb) in cells_b:
                    if abs(ra - rb) <= 1 and abs(ca - cb) <= 1:
                        conflicts.append(
                            f"  КОНФЛИКТ: {id_a} ({cell_label(ra,ca)}) "
                            f"слишком близко к {id_b} ({cell_label(rb,cb)})"
                        )
    
    # Check no two items share a cell
    all_cells = []
    for item_id, cells in placement.items():
        for cell in cells:
            all_cells.append((cell, item_id))
    cell_map = {}
    for cell, item_id in all_cells:
        if cell in cell_map:
            conflicts.append(f"  ПЕРЕКРЫТИЕ: {item_id} и {cell_map[cell]} в {cell_label(*cell)}")
        cell_map[cell] = item_id

    if conflicts:
        print("INVALID - найдены конфликты:")
        for c in conflicts:
            print(c)
    else:
        print("VALID - все объекты размещены корректно, зазор соблюдён!")

    # Summary stats
    total_cells = sum(len(c) for c in placement.values())
    print(f"\nИтого клеток занято: {total_cells} из {ROWS * COLS} ({ROWS * COLS - total_cells} свободно)")

def main():
    print("Запуск решателя расстановки (backtracking)...")
    print(f"Сетка: {ROWS} строк x {COLS} столбцов\n")
    
    success, placement = solve()
    
    if not success:
        print("ОШИБКА: решение не найдено!")
        return
    
    print("Решение найдено!\n")
    print("=== ВИЗУАЛИЗАЦИЯ СЕТКИ ===\n")
    print_grid(placement)
    print("\n=== ТАБЛИЦА РАССТАНОВКИ ===")
    print_table(placement)
    validate(placement)

if __name__ == '__main__':
    main()
