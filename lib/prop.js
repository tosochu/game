export const PROP_R = 50
export const DEFAULT_PROP_CNT = 60;
export const Props = [];
function applyProp(id, name, chance, description, key) {
    Props.push({ id, name, chance, description, key });
}

applyProp('ice', '冰块', 5, '冰冻 3s 距离你最近的猎人来禁止其运动。', 'i');
applyProp('web', '蜘蛛网', 5, '在当前位置放置一个随机大小的蜘蛛网，使经过此处的猎人或者其他逃走者减速。', 'w');
applyProp('vweb', '蜘蛛网', 1, '接下来 5s 内不断在当前位置放置一个小蜘蛛网，使经过此处的猎人或者其他逃走者减速。', 'v');

export function randomProp() {
    var x = Math.random(), total = 0;
    for (var prop of Props) total += prop.chance;
    var now = 0;
    for (var prop of Props) {
        now += prop.chance;
        if (x < now / total) return prop.id;
    }
}
