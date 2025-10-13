export const PROP_R = 50
export const DEFAULT_PROP_CNT = 60;
export const Props = [];
export const PropsMap = {};
function applyProp(id, name, chance, description, key, is_hunter = false, is_fugitive = true) {
    const obj = { id, name, chance, description, key, is_hunter, is_fugitive }
    Props.push(obj);
    PropsMap[id] = obj;
}

applyProp('ice', '冰块', 5, '冰冻 2s 距离你最近的猎人来禁止其运动。', 'i');
applyProp('web', '蜘蛛网', 5, '在当前位置放置一个随机大小的蜘蛛网，使经过此处的猎人或者其他逃走者减速。', 'w', true);
applyProp('vweb', '蜘蛛网', 1, '接下来 5s 内不断在当前位置放置一个小蜘蛛网，使经过此处的猎人或者其他逃走者减速。', 'v');
applyProp('radar', '雷达', 3, '接下来 10s 内在小地图中显示所有人的位置。', 'r', true, false);

export function randomProp() {
    var x = Math.random(), total = 0;
    for (var prop of Props) total += prop.chance;
    var now = 0;
    for (var prop of Props) {
        now += prop.chance;
        if (x < now / total) return prop.id;
    }
}
