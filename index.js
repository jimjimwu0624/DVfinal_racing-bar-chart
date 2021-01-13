function define(runtime, observer) {
    const main = runtime.module();
    const fileAttachments = new Map([
        ["finaldata3.csv", "./finaldata3.csv"]
    ]);
    main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
    main.variable(observer()).define(["md"], function(md) {
        return (
            md `# Top 10 Diseases Cause of Death`
        )
    });
    main.variable(observer("viewof replay")).define("viewof replay", ["html"], function(html) {
        return (
            html `<button>Replay`
        )
    });
    main.define("replay", ["Generators", "viewof replay"], (G, _) => G.input(_));
    main.variable(observer("chart")).define("chart", ["replay", "d3", "width", "height", "bars", "axis", "labels", "ticker", "keyframes", "duration", "x", "invalidation"], async function*(replay, d3, width, height, bars, axis, labels, ticker, keyframes, duration, x, invalidation) {
        replay;

        const svg = d3.create("svg")
            .attr("viewBox", [0, 0, width, height]);

        const updateBars = bars(svg);
        const updateAxis = axis(svg);
        const updateLabels = labels(svg);
        const updateTicker = ticker(svg);

        yield svg.node();

        for (const keyframe of keyframes) {
            const transition = svg.transition()
                .duration(duration)
                .ease(d3.easeLinear);

            // Extract the top bar’s value.
            x.domain([0, keyframe[1][0].value]);

            updateAxis(keyframe, transition);
            updateBars(keyframe, transition);
            updateLabels(keyframe, transition);
            updateTicker(keyframe, transition);

            invalidation.then(() => svg.interrupt());
            await transition.end();
        }
    });
    main.variable(observer()).define(["md"], function(md) {
        return (
            md `# Description #
            Certain infectious and parasitic diseases :　傳染病、寄生蟲  
            Neoplasms :　腫瘤　
            Diseases of the blood and blood-forming organs and certain disorders involving the immune mechanism :　血液、造血器官、免疫疾病
            Endocrine, nutritional and metabolic diseases :　內分泌、營養、代謝疾病
            Mental and behavioural disorders :　精神疾病及行為障礙
            Diseases of the nervous system :　神經系統疾病
            Diseases of the circulatory system :　循環系統疾病
            Diseases of the respiratory system :　呼吸系統疾病
            Diseases of the digestive system :　消化系統疾病
            Diseases of the skin and subcutaneous tissue :　皮膚及皮下組織疾病
            Diseases of the musculoskeletal system and connective tissue :　肌肉骨骼系統及結締組織疾病
            Diseases of the genitourinary system :　泌尿生殖系統疾病
            Certain conditions originating in the perinatal period :　源於周產期(從孕22~28周之間)的疾病
            Congenital malformations, deformations and chromosomal abnormalities :　先天性畸形，變形和染色體異常
            Symptoms, signs and abnormal clinical and laboratory findings, not elsewhere classified :　異常症狀及檢查結果
            External causes of morbidity and mortality :　發病的外部原因
            Pregnancy, childbirth and the puerperium :　懷孕、分娩、產期
            Diseases of the eye and adnexa :　眼睛及附件疾病
            Diseases of the ear and mastoid process :　耳朵及乳突疾病`
        )
    });
    main.define("duration", function() {
        return (
            20
        )
    });


    main.define(["data"], function(data) {
        return (
            data
        )
    });
    main.define("data", ["d3", "FileAttachment"], async function(d3, FileAttachment) {
        return (
            d3.csvParse(await FileAttachment("finaldata3.csv").text(), d3.autoType)
        )
    });
    main.define(["d3", "data"], function(d3, data) {
        return (
            d3.group(data, d => d.name)
        )
    });

    main.define(["data"], function(data) {
        return (
            data.filter(d => d.name === "Pregnancy, childbirth and the puerperium")
        )
    });
    main.define(["data"], function(data) {
        return (
            data.filter(d => d.name === "Diseases of the eye and adnexa")
        )
    });
    main.define(["data"], function(data) {
        return (
            data.filter(d => d.name === "Diseases of the ear and mastoid process")
        )
    });

    main.define("n", function() {
        return (
            10
        )
    });

    main.define("names", ["data"], function(data) {
        return (
            new Set(data.map(d => d.name))
        )
    });

    main.define("datevalues", ["d3", "data"], function(d3, data) {
        return (
            Array.from(d3.rollup(data, ([d]) => d.value, d => +d.date, d => d.name))
            .map(([date, data]) => [new Date(date), data])
            .sort(([a], [b]) => d3.ascending(a, b))
        )
    });

    main.define("rank", ["names", "d3", "n"], function(names, d3, n) {
        return (
            function rank(value) {
                const data = Array.from(names, name => ({ name, value: value(name) }));
                data.sort((a, b) => d3.descending(a.value, b.value));
                for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
                return data;
            }
        )
    });

    main.define(["rank", "datevalues"], function(rank, datevalues) {
        return (
            rank(name => datevalues[0][1].get(name))
        )
    });

    main.define("k", function() {
        return (
            10
        )
    });

    main.define("keyframes", ["d3", "datevalues", "k", "rank"], function(d3, datevalues, k, rank) {
        const keyframes = [];
        let ka, a, kb, b;
        for ([
                [ka, a],
                [kb, b]
            ] of d3.pairs(datevalues)) {
            for (let i = 0; i < k; ++i) {
                const t = i / k;
                keyframes.push([
                    new Date(ka * (1 - t) + kb * t),
                    rank(name => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t)
                ]);
            }
        }
        keyframes.push([new Date(kb), rank(name => b.get(name) || 0)]);
        return keyframes;
    });

    main.define("nameframes", ["d3", "keyframes"], function(d3, keyframes) {
        return (
            d3.groups(keyframes.flatMap(([, data]) => data), d => d.name)
        )
    });
    main.define("prev", ["nameframes", "d3"], function(nameframes, d3) {
        return (
            new Map(nameframes.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a])))
        )
    });
    main.define("next", ["nameframes", "d3"], function(nameframes, d3) {
        return (
            new Map(nameframes.flatMap(([, data]) => d3.pairs(data)))
        )
    });


    main.define("bars", ["n", "color", "y", "x", "prev", "next"], function(n, color, y, x, prev, next) {
        return (
            function bars(svg) {
                let bar = svg.append("g")
                    .attr("fill-opacity", 0.6)
                    .selectAll("rect");

                return ([date, data], transition) => bar = bar
                    .data(data.slice(0, n), d => d.name)
                    .join(
                        enter => enter.append("rect")
                        .attr("fill", color)
                        .attr("height", y.bandwidth())
                        .attr("x", x(0))
                        .attr("y", d => y((prev.get(d) || d).rank))
                        .attr("width", d => x((prev.get(d) || d).value) - x(0)),
                        update => update,
                        exit => exit.transition(transition).remove()
                        .attr("y", d => y((next.get(d) || d).rank))
                        .attr("width", d => x((next.get(d) || d).value) - x(0))
                    )
                    .call(bar => bar.transition(transition)
                        .attr("y", d => y(d.rank))
                        .attr("width", d => x(d.value) - x(0)));
            }
        )
    });

    main.define("labels", ["n", "x", "prev", "y", "next", "textTween"], function(n, x, prev, y, next, textTween) {
        return (
            function labels(svg) {
                let label = svg.append("g")
                    .style("font-variant-numeric", "tabular-nums")
                    .attr("text-anchor", "start")
                    .selectAll("text");

                return ([date, data], transition) => label = label
                    .data(data.slice(0, n), d => d.name)
                    .join(
                        enter => enter.append("text")
                        .attr("transform", d => `translate(${x((prev.get(d) || d).value)},${y((prev.get(d) || d).rank)})`)
                        .attr("y", y.bandwidth() / 2)
                        .attr("x", 6)
                        .attr("dy", "-0.25em")
                        .text(d => d.name)
                        .call(text => text.append("tspan")
                            .attr("fill-opacity", 0.7)
                            .attr("font-weight", "normal")
                            .attr("x", 6)
                            .attr("dy", "1.15em")),
                        update => update,
                        exit => exit.transition(transition).remove()
                        .attr("transform", d => `translate(${x((next.get(d) || d).value)},${y((next.get(d) || d).rank)})`)
                        .call(g => g.select("tspan").tween("text", d => textTween(d.value, (next.get(d) || d).value)))
                    )
                    .call(bar => bar.transition(transition)
                        .attr("transform", d => `translate(${x(d.value)},${y(d.rank)})`)
                        .call(g => g.select("tspan").tween("text", d => textTween((prev.get(d) || d).value, d.value))))
            }
        )
    });

    main.define("textTween", ["d3", "formatNumber"], function(d3, formatNumber) {
        return (
            function textTween(a, b) {
                const i = d3.interpolateNumber(a, b);
                return function(t) {
                    this.textContent = formatNumber(i(t));
                };
            }
        )
    });

    main.define("formatNumber", ["d3"], function(d3) {
        return (
            d3.format(",d")
        )
    });
    main.define("axis", ["margin", "d3", "x", "width", "barSize", "n", "y"], function(margin, d3, x, width, barSize, n, y) {
        return (
            function axis(svg) {
                const g = svg.append("g")
                    .attr("transform", `translate(0,${margin.top})`);

                const axis = d3.axisTop(x)
                    .ticks(width / 160)
                    .tickSizeOuter(0)
                    .tickSizeInner(-barSize * (n + y.padding()));

                return (_, transition) => {
                    g.transition(transition).call(axis);
                    g.select(".tick:first-of-type text").remove();
                    g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white");
                    g.select(".domain").remove();
                };
            }
        )
    });

    main.define("ticker", ["barSize", "width", "margin", "n", "formatDate", "keyframes"], function(barSize, width, margin, n, formatDate, keyframes) {
        return (
            function ticker(svg) {
                const now = svg.append("text")
                    .style("font", `bold ${barSize}px var(--sans-serif)`)
                    .style("font-variant-numeric", "tabular-nums")
                    .style("font-size", 60)
                    .attr("text-anchor", "end")
                    .attr("x", width - 200)
                    .attr("y", margin.top + barSize * (n - 0.45) - 30)
                    .attr("dy", "0.32em")
                    .text(formatDate(keyframes[0][0]));

                return ([date], transition) => {
                    transition.end().then(() => now.text(formatDate(date)));
                };
            }
        )
    });

    main.define("formatDate", ["d3"], function(d3) {
        return (
            d3.utcFormat("%Y-%m")
        )
    });

    main.define("color", ["d3", "data"], function(d3, data) {
        const scale = d3.scaleOrdinal(d3.schemeTableau10);
        if (data.some(d => d.category !== undefined)) {
            const categoryByName = new Map(data.map(d => [d.name, d.category]))
            scale.domain(Array.from(categoryByName.values()));
            return d => scale(categoryByName.get(d.name));
        }
        return d => scale(d.name);
    });

    main.define("x", ["d3", "margin", "width"], function(d3, margin, width) {
        return (
            d3.scaleLinear([0, 1], [margin.left, width - margin.right - 220])
        )
    });

    main.define("y", ["d3", "n", "margin", "barSize"], function(d3, n, margin, barSize) {
        return (
            d3.scaleBand()
            .domain(d3.range(n + 1))
            .rangeRound([margin.top, margin.top + barSize * (n + 1 + 0.1)])
            .padding(0.1)
        )
    });

    main.define("height", ["margin", "barSize", "n"], function(margin, barSize, n) {
        return (
            margin.top + barSize * n + margin.bottom
        )
    });
    main.define("barSize", function() {
        return (
            48
        )
    });
    main.define("margin", function() {
        return ({ top: 16, right: 6, bottom: 6, left: 0 })
    });
    main.define("d3", ["require"], function(require) {
        return (
            require("d3@5", "d3-array@2")
        )
    });
    return main;
}