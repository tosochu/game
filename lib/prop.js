export const PROP_R = 50;
export const Props = [];
function applyProp(id, name, chance, description) {
    Props.push({ id, name, chance, description });
}

applyProp('ice', '冰块', 5, '冰冻 5s 距离你最近的 Hunter 来禁止其运动。');

export function randomProp() {
    var x = Math.random(), total = 0;
    for (var prop of Props) total += prop.chance;
    var now = 0;
    for (var prop of Props) {
        now += prop.chance;
        if (x < now / total) return prop.id;
    }
}