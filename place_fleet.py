import random

random.seed(42)

ROWS = 9
COLS = 10
ROW_LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И']

ITEMS = [
    ('Линкор',      4),
    ('Крейсер 1',   3),
    ('Крейсер 2',   3),
    ('Эсминец 1',   2),
    ('Эсминец 2',   2),
    ('Эсминец 3',   2),
    ('Подлодка 1',  1),
    ('Подлодка 2',  1),
    ('Подлодка 3',  1),
    ('Подлодка 4',  1),
    ('Бомба 1',     1),
    ('Бомба 2',     1),
    ('Бомба 3',     1),
    ('Бомба 4',     1),
]

def cell_label(r, c):
    return f"{ROW_LETTERS[r]}{c + 1}"

def get_cells(r, c, length, horizontal):
    if horizontal:
        return [(r, c + i) for i in range(length)]
    else:
        return [(r + i, c) for i in range(length)]

def in_bounds(cells):
    return all(0 <= r < ROWS and 0 <= c < COLS for r, c in cells)

def get_forbidden(cells):
    forbidden = set()
    for r, c in cells:
        for dr in range(-1, 2):
            for dc in range(-1, 2):
                forbidden.add((r + dr, c + dc))
    return forbidden

def solve(items, grid_occupied, forbidden_cells, placement):
    if not items:
        return True

    name, length = items[0]
    rest = items[1:]

    # Build candidate placements
    candidates = []
    for r in range(ROWS):
        for c in range(COLS):
            for horizontal in ([True, False] if length > 1 else [True]):
                cells = get_cells(r, c, length, horizontal)
                if not in_bounds(cells):
                    continue
                if any(cell in grid_occupied or cell in forbidden_cells for cell in cells):
                    continue
                candidates.append((cells, horizontal))

    random.shuffle(candidates)

    for cells, horizontal in candidates:
        new_forbidden = get_forbidden(cells)
        placement.append((name, cells))
        new_occupied = grid_occupied | set(cells)
        new_forbidden_cells = forbidden_cells | new_forbidden

        if solve(rest, new_occupied, new_forbidden_cells, placement):
            return True

        placement.pop()

    return False

def main():
    placement = []
    success = solve(ITEMS, set(), set(), placement)

    if not success:
        print("No solution found!")
        return

    # Build display grid
    grid = [['.' for _ in range(COLS)] for _ in range(ROWS)]
    item_symbol = {}

    symbol_map = {
        'Линкор':     '4',
        'Крейсер 1':  '3',
        'Крейсер 2':  '3',
        'Эсминец 1':  '2',
        'Эсминец 2':  '2',
        'Эсминец 3':  '2',
        'Подлодка 1': '1',
        'Подлодка 2': '1',
        'Подлодка 3': '1',
        'Подлодка 4': '1',
        'Бомба 1':    'B',
        'Бомба 2':    'B',
        'Бомба 3':    'B',
        'Бомба 4':    'B',
    }

    for name, cells in placement:
        sym = symbol_map[name]
        for r, c in cells:
            grid[r][c] = sym

    # Print grid
    print("=" * 60)
    print("GRID (9x10):")
    print("=" * 60)
    header = "    " + "  ".join(f"{i+1:2}" for i in range(COLS))
    print(header)
    print("    " + "-" * (COLS * 4 - 1))
    for r in range(ROWS):
        row_str = f" {ROW_LETTERS[r]}  | " + "   ".join(grid[r][c] for c in range(COLS))
        print(row_str)
    print()

    # Print table
    print("=" * 60)
    print(f"{'Item':<15} {'Size':>4}  {'Cells'}")
    print("=" * 60)
    for name, cells in placement:
        labels = ", ".join(cell_label(r, c) for r, c in sorted(cells))
        print(f"{name:<15} {len(cells):>4}  {labels}")
    print()

    # Validation
    print("=" * 60)
    print("VALIDATION:")
    print("=" * 60)

    all_placed = {}
    for name, cells in placement:
        for cell in cells:
            all_placed[cell] = name

    conflicts = []
    for name, cells in placement:
        cell_set = set(cells)
        forbidden = get_forbidden(cells)
        # Remove own cells from forbidden check targets
        forbidden -= cell_set
        for fc in forbidden:
            if fc in all_placed and all_placed[fc] != name:
                conflict_pair = tuple(sorted([name, all_placed[fc]]))
                if conflict_pair not in [tuple(sorted(c)) for c in conflicts]:
                    conflicts.append([name, all_placed[fc]])

    if not conflicts:
        print("VALID - All items have at least 1 empty cell gap in all 8 directions.")
    else:
        print("CONFLICTS FOUND:")
        for a, b in conflicts:
            print(f"  - {a} and {b} are too close!")

    print()
    total_cells = sum(len(cells) for _, cells in placement)
    print(f"Total cells used: {total_cells}")
    print(f"  Ships: {sum(len(c) for n, c in placement if 'Бомба' not in n)}")
    print(f"  Bombs: {sum(len(c) for n, c in placement if 'Бомба' in n)}")

if __name__ == '__main__':
    main()
