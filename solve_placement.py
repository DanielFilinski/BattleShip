import random

ROWS = 9
COLS = 10

ROW_LETTERS = {
    1: 'А', 2: 'Б', 3: 'В', 4: 'Г', 5: 'Д',
    6: 'Е', 7: 'Ж', 8: 'З', 9: 'И'
}

# Items to place: (name, size)
ITEMS = [
    ('ship1', 4),
    ('ship2', 3),
    ('ship3', 2),
    ('ship4', 2),
    ('ship5', 1),
    ('ship6', 1),
    ('ship7', 1),
    ('bomb1', 1),
    ('bomb2', 1),
    ('bomb3', 1),
    ('bomb4', 1),
]

def cells_for_placement(row, col, size, horizontal):
    cells = []
    for i in range(size):
        if horizontal:
            cells.append((row, col + i))
        else:
            cells.append((row + i, col))
    return cells

def in_bounds(cells):
    for r, c in cells:
        if r < 1 or r > ROWS or c < 1 or c > COLS:
            return False
    return True

def get_exclusion_zone(cells):
    zone = set()
    for r, c in cells:
        for dr in [-1, 0, 1]:
            for dc in [-1, 0, 1]:
                zone.add((r + dr, c + dc))
    return zone

def can_place(grid_blocked, cells):
    for r, c in cells:
        if (r, c) in grid_blocked:
            return False
    return True

def solve(items, grid_blocked, placement, index):
    if index == len(items):
        return True

    name, size = items[index]
    orientations = [True, False] if size > 1 else [True]

    positions = []
    for row in range(1, ROWS + 1):
        for col in range(1, COLS + 1):
            for horiz in orientations:
                cells = cells_for_placement(row, col, size, horiz)
                if in_bounds(cells) and can_place(grid_blocked, cells):
                    positions.append((row, col, horiz, cells))

    random.shuffle(positions)

    for row, col, horiz, cells in positions:
        exclusion = get_exclusion_zone(cells)
        new_blocked = grid_blocked | exclusion
        placement[name] = cells

        if solve(items, new_blocked, placement, index + 1):
            return True

        del placement[name]

    return False

def print_solution(placement):
    # Map each cell to its item name
    cell_to_item = {}
    for name, cells in placement.items():
        for cell in cells:
            cell_to_item[cell] = name

    print("=" * 70)
    print("GRID VISUALIZATION (rows А-И, cols 1-10)")
    print("=" * 70)

    # Column header
    col_header = "      " + "  ".join(f"{c:2}" for c in range(1, COLS + 1))
    print(col_header)
    print("      " + "----" * COLS)

    for r in range(1, ROWS + 1):
        row_chars = []
        for c in range(1, COLS + 1):
            if (r, c) in cell_to_item:
                name = cell_to_item[(r, c)]
                # Use first char of type + number: ship1->'S1', bomb1->'B1'  — wait, user said NO abbreviation
                # Show full symbol differently: use item index
                # Actually show a 2-char code: s1..s7, b1..b4
                if name.startswith('ship'):
                    sym = 's' + name[4]
                else:
                    sym = 'b' + name[4]
                row_chars.append(f" {sym}")
            else:
                row_chars.append("  .")
        print(f" {ROW_LETTERS[r]}  | " + " ".join(row_chars))

    print()
    print("Legend: s1=ship1 s2=ship2 s3=ship3 s4=ship4 s5=ship5 s6=ship6 s7=ship7")
    print("        b1=bomb1 b2=bomb2 b3=bomb3 b4=bomb4")

    print()
    print("=" * 70)
    print("ITEM PLACEMENTS (letter-number format)")
    print("=" * 70)

    for name, cells in sorted(placement.items()):
        cell_strs = [f"{ROW_LETTERS[r]}{c}" for r, c in sorted(cells)]
        size = len(cells)
        if size > 1:
            orient = "horizontal" if cells[0][0] == cells[1][0] else "vertical"
            print(f"  {name:8s} (size {size}, {orient:10s}): {', '.join(cell_strs)}")
        else:
            print(f"  {name:8s} (size {size}            ): {cell_strs[0]}")

def validate_solution(placement):
    all_cells = {}
    for name, cells in placement.items():
        for cell in cells:
            if cell in all_cells:
                print(f"ERROR: Cell {cell} used by both {all_cells[cell]} and {name}!")
                return False
            all_cells[cell] = name

    for name_a, cells_a in placement.items():
        excl_a = get_exclusion_zone(cells_a)
        for name_b, cells_b in placement.items():
            if name_a == name_b:
                continue
            for cell in cells_b:
                if cell in excl_a:
                    print(f"ERROR: {name_b} cell {cell} is adjacent/diagonal to {name_a}!")
                    return False

    print("VALIDATION PASSED: No overlaps, no adjacency (including diagonals). All gaps respected.")
    return True

def main():
    random.seed(42)
    placement = {}
    grid_blocked = set()

    print("Running backtracking solver...")
    success = solve(ITEMS, grid_blocked, placement, 0)

    if not success:
        print("No solution found!")
        return

    print(f"Solution found! Placed {len(ITEMS)} items ({sum(len(v) for v in placement.values())} total cells).\n")
    print_solution(placement)
    print()
    validate_solution(placement)

    print()
    print("=" * 70)
    print("RAW (row, col) COORDINATES — 1-indexed")
    print("=" * 70)
    for name, cells in sorted(placement.items()):
        print(f"  {name:8s}: {sorted(cells)}")

if __name__ == '__main__':
    main()
