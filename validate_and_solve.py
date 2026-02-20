#!/usr/bin/env python3
"""
Battleship placement validator and solver for a 9x10 grid.
Rows: 1-9 (A-И), Columns: 1-10
Rule: No two ships/bombs can occupy adjacent cells including diagonals (min 1 cell gap).
"""

from itertools import product

ROWS = 9
COLS = 10

ROW_LABELS = {1: 'A', 2: 'Б', 3: 'В', 4: 'Г', 5: 'Д', 6: 'Е', 7: 'Ж', 8: 'З', 9: 'И'}

# ─── Validator ────────────────────────────────────────────────────────────────

def get_zone(cells):
    """Return all cells + their 1-cell border (including diagonals)."""
    zone = set()
    for (r, c) in cells:
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                nr, nc = r + dr, c + dc
                if 1 <= nr <= ROWS and 1 <= nc <= COLS:
                    zone.add((nr, nc))
    return zone

def validate_placement(items):
    """
    items: list of dict {'id': str, 'cells': list of (r,c)}
    Returns list of conflict descriptions.
    """
    conflicts = []
    n = len(items)
    for i in range(n):
        for j in range(i + 1, n):
            a = items[i]
            b = items[j]
            a_cells = set(a['cells'])
            b_cells = set(b['cells'])
            # Direct overlap
            overlap = a_cells & b_cells
            if overlap:
                conflicts.append(
                    f"OVERLAP: {a['id']} and {b['id']} share cells {overlap}"
                )
                continue
            # Adjacency check (including diagonals)
            zone_a = get_zone(a_cells)
            if zone_a & b_cells:
                conflicts.append(
                    f"ADJACENT: {a['id']} {sorted(a['cells'])} and "
                    f"{b['id']} {sorted(b['cells'])} are too close"
                )
    return conflicts

def print_grid(items):
    grid = [['.' for _ in range(COLS)] for _ in range(ROWS)]
    for item in items:
        sym = item['id'][0].upper()
        for (r, c) in item['cells']:
            grid[r - 1][c - 1] = sym
    header = "    " + "  ".join(str(c) for c in range(1, COLS + 1))
    print(header)
    for r in range(ROWS):
        row_sym = ROW_LABELS[r + 1]
        print(f" {row_sym}  " + "  ".join(grid[r]))

# ─── Solver ───────────────────────────────────────────────────────────────────

def generate_placements(size, orientation):
    """Generate all valid (r,c) starting positions for a ship of given size and orientation."""
    results = []
    if orientation == 'H':
        for r in range(1, ROWS + 1):
            for c in range(1, COLS - size + 2):
                cells = tuple((r, c + i) for i in range(size))
                results.append(cells)
    else:  # V
        for r in range(1, ROWS - size + 2):
            for c in range(1, COLS + 1):
                cells = tuple((r + i, c) for i in range(size))
                results.append(cells)
    return results

def cells_conflict(new_cells, occupied_zone):
    """Check if new_cells touch or overlap the existing occupied zone."""
    new_set = set(new_cells)
    # Overlap
    if new_set & occupied_zone:
        return True
    return False

def zone_of(cells):
    """Return the zone (cells + border) for a set of cells."""
    zone = set()
    for (r, c) in cells:
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                nr, nc = r + dr, c + dc
                if 1 <= nr <= ROWS and 1 <= nc <= COLS:
                    zone.add((nr, nc))
    return zone

def solve():
    """
    Backtracking solver.
    Ship sizes: 4, 3, 2, 2, 2, 1, 1, 1, 3, 2  → 10 ships
    Bombs: 4 × size-1
    """
    # Define pieces: (id, size)
    pieces = [
        ('ship1_Linkor4',   4),
        ('ship2_Kreyser3',  3),
        ('ship9_Kreyser2',  3),
        ('ship3_Esminets1', 2),
        ('ship4_Esminets2', 2),
        ('ship5_Esminets3', 2),
        ('ship10_Esminets4',2),
        ('ship6_Podlodka1', 1),
        ('ship7_Podlodka2', 1),
        ('ship8_Podlodka3', 1),
        ('bomb1',           1),
        ('bomb2',           1),
        ('bomb3',           1),
        ('bomb4',           1),
    ]

    # Pre-generate placements for each piece
    # For size-1, orientation doesn't matter
    piece_options = []
    for (pid, size) in pieces:
        if size == 1:
            opts = [((r, c),) for r in range(1, ROWS + 1) for c in range(1, COLS + 1)]
        else:
            opts = generate_placements(size, 'H') + generate_placements(size, 'V')
        piece_options.append(opts)

    solution = []

    def backtrack(idx, occupied_zone, occupied_cells):
        if idx == len(pieces):
            return True
        pid, size = pieces[idx]
        for cells in piece_options[idx]:
            cell_set = set(cells)
            # Check no overlap with occupied cells AND no adjacency with any placed piece
            if not (cell_set & occupied_zone):
                # Place it
                new_zone = zone_of(cells)
                solution.append((pid, cells))
                if backtrack(
                    idx + 1,
                    occupied_zone | new_zone,
                    occupied_cells | cell_set
                ):
                    return True
                solution.pop()
        return False

    print("=" * 60)
    print("SOLVER: searching for valid placement ...")
    print("=" * 60)

    if backtrack(0, set(), set()):
        print("VALID PLACEMENT FOUND:\n")
        items = [{'id': pid, 'cells': list(cells)} for pid, cells in solution]
        for item in items:
            label = "BOMB" if item['id'].startswith('bomb') else "SHIP"
            coords = ", ".join(
                f"({ROW_LABELS[r]},{c})" for r, c in sorted(item['cells'])
            )
            raw = ", ".join(f"({r},{c})" for r, c in sorted(item['cells']))
            print(f"  {label:4s} {item['id']:25s}: {coords}  [{raw}]")
        print()
        print("GRID VISUALIZATION:")
        print_grid(items)
        print()
        # Final validation
        conflicts = validate_placement(items)
        if conflicts:
            print("VALIDATION ERRORS (should not happen):")
            for c in conflicts:
                print(" ", c)
        else:
            print("VALIDATION PASSED — no conflicts.")
    else:
        print("No valid placement found (backtracking exhausted).")

# ─── Validate the user's original proposed placement ──────────────────────────

def validate_original():
    print("=" * 60)
    print("VALIDATING ORIGINAL PROPOSED PLACEMENT")
    print("=" * 60)

    items = [
        {'id': 'ship1_Linkor4',    'cells': [(1,1),(1,2),(1,3),(1,4)]},
        {'id': 'ship2_Kreyser3',   'cells': [(1,6),(1,7),(1,8)]},
        {'id': 'ship3_Esminets1',  'cells': [(1,10),(2,10)]},
        {'id': 'ship4_Esminets2',  'cells': [(4,1),(4,2)]},
        {'id': 'ship5_Esminets3',  'cells': [(9,1),(9,2)]},
        {'id': 'ship6_Podlodka1',  'cells': [(3,6)]},
        {'id': 'ship7_Podlodka2',  'cells': [(6,4)]},
        {'id': 'ship8_Podlodka3',  'cells': [(7,7)]},
        {'id': 'ship9_Kreyser2',   'cells': [(8,8),(8,9),(8,10)]},
        {'id': 'ship10_Esminets4', 'cells': [(5,5),(5,6)]},
        {'id': 'bomb1',            'cells': [(3,3)]},
        {'id': 'bomb2',            'cells': [(6,1)]},
        {'id': 'bomb3',            'cells': [(4,9)]},
        {'id': 'bomb4',            'cells': [(2,7)]},
    ]

    print("\nProposed layout:")
    print_grid(items)
    print()

    conflicts = validate_placement(items)
    if conflicts:
        print(f"CONFLICTS FOUND ({len(conflicts)}):")
        for c in conflicts:
            print(" ", c)
    else:
        print("No conflicts — placement is valid.")
    print()

# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    validate_original()
    print()
    solve()
