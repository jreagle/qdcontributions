// INITIALIZE ACTIONS


// BUILD FAKE SPA => SINGLE-PAGE APPLICATIONS
// W/ TOGGLE SHOW SECTION
function toggleShowSection(target) {
    //targetSection = target.closest('section')
    document.querySelectorAll(`section`)
        .forEach(s => s.classList.add('d-none'))
    document.querySelector(`section#${target}`).classList.remove('d-none')
}

// INSTATIATE "QD" OBJECT
if (!localStorage.hasOwnProperty('qd')) {
    localStorage.setItem('qd', JSON.stringify({ cities: {}, github: {}, timestamp: new Date().getTime() }))
    const data = JSON.parse(localStorage.getItem('qd'))
    window.qd = data
} else {
    const data = JSON.parse(localStorage.getItem('qd'))
    window.qd = data
}



// BUILD WEB APPLICATION
(async () => {
    let optsUF = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"]
    optsUF.forEach(uf => document.getElementById('selectUF').insertAdjacentHTML('beforeend', `<option value="${uf}">${uf}</option>`))
    let qdStatus = ['Desconhecido (0)', 'Conhecido (1)', "Coletado (2)", "Disponível (3)"]

    // LOAD DATA API (STATIC)
    if (Object.keys(qd.cities) <= 0) {
        qd = await fetch('data/qd.json').then(r => r.json())
        localStorage.setItem('qd', JSON.stringify(qd))
        console.log('LOAD DATA FROM STATIC SERVER!')
    } else {
        console.log('WORKING WITH LOCAL DATA')
    }
    Object.values(qd.github.spiderbases)
    .forEach(label => document.getElementById('selectSpiderBase').insertAdjacentHTML('beforeend', `<option value="${label}">${label}</option>`))
    
    // BUILD FAKE ROUTING
    let urlRequest = new URL(window.location.href)
    if (urlRequest.searchParams.has('city')) {
        if (Object.keys(qd.cities).includes(urlRequest.searchParams.get('city'))) {
            console.log('URL HAS [CITY]!')
            loadPageCity(urlRequest.searchParams.get('city'))
        }
    }
    if (urlRequest.searchParams.has('author')) {
        if (Object.keys(qd.contributors).includes(urlRequest.searchParams.get('author'))) {
            console.log('URL HAS [AUTHOR]!')
            loadPageContributor(urlRequest.searchParams.get('author'))
        }
    }
    document.body.classList.remove('d-none')

    // PARSE DATA API => TABULAR DATA => DATATABLES
    qd.tables = {}
    qd.tables.cities = Object.values(qd.cities).map(city => {
        let data = {}
        Object.assign(data, city.info)
        let status = qdStatus[data.level]
        let [commits, contributions, prs, issues, gazettes] = [0, 0, 0, 0, 0]
        if (Object.keys(city).includes('collects')) {
            gazettes = city.collects.total_gazettes

        }
        if (Object.keys(city).includes('spider')) {
            commits = city.spider.commits.length
        }
        if (Object.keys(city).includes('contributions')) {
            if (Object.keys(city.contributions).includes('prs')) {
                prs = city.contributions.prs.length
            }
            if (Object.keys(city.contributions).includes('issues')) {
                issues = city.contributions.issues.length
            }
            contributions = prs + issues
        }

        Object.assign(data, {
            status: status,
            gazettes: gazettes,
            commits: commits,
            contributions: contributions,
            prs: prs,
            issues: issues,
            spiderbases: city.info.spiderbase ? city.info.spiderbase : false
        })
        return data
    })

    qd.tables.contributors = Object.entries(qd.contributors).map(([k, v]) => {
        let obj = {}
        Object.assign(obj, {
            author: k,
            cities: v.cities.length,
            commits: v.commits ? v.commits.length : 0,
            prs: v.prs ? v.prs.length : 0,
            issues: v.issues ? v.issues.length : 0,
            // all: obj.cities + obj.commits + obj.prs + obj.issues
        })
        return obj
    })

    // INSTATIATE OJBECT DATATABLE AND LOAD TABULAR DATA
    window.qdTableCities =
        $('#tableCitiesOverview').DataTable({
            pageLength: 15,
            ordering: false,
            data: qd.tables.cities,
            columns: [
                { data: 'territory_id', className: 'text-center' },
                { data: 'territory_name', className: 'text-center' },
                { data: 'state_code', className: 'text-center' },
                { data: 'status', className: 'text-center' },
                { data: 'gazettes', className: 'text-center' },
                { data: 'contributions', className: 'text-center' },
                {
                    data: 'spiderbases', className: 'text-center',
                    render: function (data, type, row) {
                        if (data !== false) {
                            let listBadges = data.map(label => `<span class="badge text-bg-warning">${label}</span>`).join(' ')
                            //console.log(listBadges)
                            return listBadges
                        } else { return '-'; }
                        
                    }
                }
            ],
            searchCols: [
                null,
                null,
                null,
                null,
                null,//{ search: 'Coletado' },
                null,
                null
            ],
            layout: {
                topStart: '',
                topEnd: '',
            },
            language: {
                "decimal": "",
                "emptyTable": "Nenhum dado foi carregado",
                "info": "Exibindo _START_ to _END_ de _TOTAL_ registros",
                "infoEmpty": "Exibindo 0 a 0 de 0 registros",
                "infoFiltered": "(filtrados de _MAX_ total registros)",
                "infoPostFix": "",
                "thousands": ",",
                "lengthMenu": "Exibindo _MENU_ registros",
                "loadingRecords": "Carregando...",
                "processing": "",
                "search": "Pesquisar:",
                "zeroRecords": "Nenhum combinação encontrada",
                "paginate": {
                    "first": "Primeiro",
                    "last": "Último",
                    "next": "Próximo",
                    "previous": "Anterior"
                },
                "aria": {
                    "orderable": "Ordenado por essa coluna",
                    "orderableReverse": "Ordem reversa dessa coluna"
                }
            }
        });

    $('#tableCitiesOverview tbody').on('click', 'tr', function () {
        loadPageCity(qdTableCities.row(this).data().territory_id)
    })


    window.qdTableContributors =
        $('#tableContributorsOverview').DataTable({
            pageLength: 15,
            ordering: false,
            data: qd.tables.contributors,
            columns: [
                { data: 'author', className: 'text-center' },
                { data: 'cities', className: 'text-center' },
                { data: 'commits', className: 'text-center' },
                { data: 'prs', className: 'text-center' },
                { data: 'issues', className: 'text-center' },
                // { data: 'contributions', className: 'text-center' },
            ],
            searchCols: [
                null,
                null,
                null,
                null,
                null,//{ search: 'Coletado' },
                // null,
            ],
            layout: {
                topStart: '',
                topEnd: '',
            },
            language: {
                "decimal": "",
                "emptyTable": "Nenhum dado foi carregado",
                "info": "Exibindo _START_ to _END_ de _TOTAL_ registros",
                "infoEmpty": "Exibindo 0 a 0 de 0 registros",
                "infoFiltered": "(filtrados de _MAX_ total registros)",
                "infoPostFix": "",
                "thousands": ",",
                "lengthMenu": "Exibindo _MENU_ registros",
                "loadingRecords": "Carregando...",
                "processing": "",
                "search": "Pesquisar:",
                "zeroRecords": "Nenhum combinação encontrada",
                "paginate": {
                    "first": "Primeiro",
                    "last": "Último",
                    "next": "Próximo",
                    "previous": "Anterior"
                },
                "aria": {
                    "orderable": "Ordenado por essa coluna",
                    "orderableReverse": "Ordem reversa dessa coluna"
                }
            }
        });

    $('#tableContributorsOverview tbody').on('click', 'tr', function () {
        loadPageContributor(qdTableContributors.row(this).data().author)
    })

})()
// .finally('COMPLETE INITIALIZATION!')




// UTILS FUNCTIONS

function searchEnums(elem, qdTable) {
    let [cellsIndex, expr] = [elem.closest('th').cellIndex, elem.value]
    //console.log(expr,'=>',cellsIndex)
    switch (expr.substring(0, 1)) {
        case '>':
            //console.log('GREATER =>',cellsIndex)
            qdTable.column(cellsIndex).search(d => d > parseInt(expr.replace(/\D/g, ''))).draw();
            break;
        case '<':
            //console.log('LESS =>',cellsIndex)
            qdTable.column(cellsIndex).search(d => d < parseInt(expr.replace(/\D/g, ''))).draw();
            break;
        default:
            //console.log('STATSWITH =>',cellsIndex)
            qdTable.column(cellsIndex).search(new RegExp('^' + expr, 'i')).draw();
    }
}

// LOAD DATA => CITY PAGE
function loadPageCity(idCity, prevRoute = null) {
    let cityData = qd.cities[idCity]
    let hideFields = ['status', 'commits', 'filename', 'contributions', 'prs', 'issues']
    if (prevRoute !== null) {
        document.getElementById('btnBackCityPage').setAttribute('onclick', `toggleShowSection('${prevRoute}')`)
    }


    // SETTLE ACCORDION (INFO)
    if (Object.keys(cityData).includes('info')) {
        let cityPageTitle = document.getElementById("cityPageTitle")
        let cityPageInfoContainer = document.getElementById("cityPageInfoContainer")
        cityPageTitle.innerHTML = `${cityData.info.territory_name} (${cityData.info.state_code})`
        document.getElementById('dtUpdate').innerHTML = new Date(parseInt(qd.timestamp)).toLocaleString().substring(0, 10)
        document.getElementById('dtUpdate').parentElement.classList.replace('d-none', 'd-block')
        cityPageInfoContainer.innerHTML = ''
        Object.entries(cityData.info).forEach(([k, v]) => {
            if (!hideFields.includes(k)) {
                if (k == 'query') {
                    cityPageInfoContainer.insertAdjacentHTML('beforeend', `<li><b>${k}: </b><a href="https://github.com/search?${new URLSearchParams({ q: v }).toString()}" target="_blank" rel="noopener noreferrer">${v}</a></li>`)
                } else if (k == 'publication_urls') {
                    if (Array.isArray(v)) {
                        let listURLs = v.map(url => `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></li>`).join('\n')
                        cityPageInfoContainer.insertAdjacentHTML('beforeend', `<li><b>${k}: </b><ul>${listURLs}</ul></li>`)
                    } else {
                        cityPageInfoContainer.insertAdjacentHTML('beforeend', `<li><b>${k}: </b>${v}</li>`)
                    }
                } else if (k == 'spiderbase') {
                    if (v.length > 0) {
                        let listBadges = v.map(label => `<span class="badge text-bg-warning">${label}</span>`).join(' ')
                        cityPageInfoContainer.insertAdjacentHTML('beforeend', `<li><b>${k}: ${listBadges}</li>`)
                    }
                }
                else {
                    cityPageInfoContainer.insertAdjacentHTML('beforeend', `<li><b>${k}: </b>${v}</li>`)
                }
            }
        })
    }

    // SETTLE ACCORDION (SPIDER)
    if (Object.keys(cityData).includes('spider')) {
        let cityPageSpiderContainerCommits = document.getElementById("cityPageSpiderContainerCommits")
        linkSpider = `
            \xa0
            <i class="bi bi-github"></i>
            <a href="https://github.com/okfn-brasil/querido-diario/tree/main/${cityData.spider.path}" target="_blank" rel="noopener noreferrer">${cityData.spider.path}</a>
            `
        //cityPageSpiderContainer.firstElementChild.innerHTML
        document.getElementById('linkSpider').innerHTML = linkSpider
        document.getElementById('lenCommits').innerHTML = cityData.spider.commits.length
        cityPageSpiderContainerCommits.innerHTML = ''
        Object.entries(cityData.spider.commits).forEach(([k, v]) => {
            cityPageSpiderContainerCommits
                .insertAdjacentHTML('beforeend', `<li class="p-2 mb-2 border border-secondary rounded">
                            <a href="${v.url}" target="_blank" rel="noopener noreferrer">${v.messageHeadline}</a> (${v.oid.slice(0, 7)}) | 
                            <img class="rounded-circle" src="${v.author.avatarUrl}&size=24" alt="">
                            <span>${v.author.name}</span> | <span>${v.committedDate}</span>
                        </li>`)
        })
    } else {
        document.getElementById('linkSpider').innerHTML = '\xa0(Não encontrado!)'
        cityPageSpiderContainerCommits.innerHTML = '(Não encontrados!)'
        document.getElementById('lenCommits').innerHTML = 0
    }

    document.getElementById('totalGazettes').href = `https://queridodiario.ok.org.br/api/gazettes?territory_ids=${idCity}&size=1`
    if (Object.keys(cityData).includes('collects')) {
        document.getElementById('totalGazettes').classList.replace('text-bg-secondary', 'text-bg-primary')
        document.getElementById('totalGazettes').innerHTML = cityData.collects.total_gazettes
    } else {
        document.getElementById('totalGazettes').classList.replace('text-bg-primary', 'text-bg-secondary')
        document.getElementById('totalGazettes').innerHTML = 0
    }

    // SETTLE ACCORDION (CONTRIUTIONS)
    if (Object.keys(cityData).includes('contributions')) {

        if (Object.keys(cityData.contributions).includes('prs')) {
            let cityPageContributionsContainerPulls = document.getElementById('cityPageContributionsContainerPulls')
            document.getElementById('lenPulls').innerHTML = cityData.contributions.prs.length
            cityPageContributionsContainerPulls.innerHTML = ''
            Object.entries(cityData.contributions.prs).forEach(([k, v]) => {
                cityPageContributionsContainerPulls
                    .insertAdjacentHTML('beforeend', `<li class="p-2 mb-2 border border-secondary rounded">
                            <a href="${v.url}" target="_blank" rel="noopener noreferrer">${v.title}</a> (#${v.number}) | 
                            <img class="rounded-circle" src="${v.author.avatarUrl}&size=24" alt="">
                            <span>${v.author.login}</span> | <span>${v.createdAt}</span>
                        </li>`)
            })
        } else {
            document.getElementById('lenPulls').innerHTML = 0
            cityPageContributionsContainerPulls.innerHTML = '<p>Sem informações!</p>'
        }
        if (Object.keys(cityData.contributions).includes('issues')) {
            let cityPageContributionsContainerIssues = document.getElementById('cityPageContributionsContainerIssues')
            document.getElementById('lenIssues').innerHTML = cityData.contributions.issues.length
            cityPageContributionsContainerIssues.innerHTML = ''
            Object.entries(cityData.contributions.issues).forEach(([k, v]) => {
                cityPageContributionsContainerIssues
                    .insertAdjacentHTML('beforeend', `<li class="p-2 mb-2 border border-secondary rounded">
                            <a href="${v.url}" target="_blank" rel="noopener noreferrer">${v.title}</a> (#${v.number}) | 
                            <img class="rounded-circle" src="${v.author.avatarUrl}&size=24" alt="">
                            <span>${v.author.login}</span> | <span>${v.createdAt}</span>
                        </li>`)
            })
        } else {
            document.getElementById('lenIssues').innerHTML = 0
            cityPageContributionsContainerIssues.innerHTML = '<p>Sem informações!</p>'
        }
        document.getElementById('lenContrib').innerHTML = parseInt(document.getElementById('lenPulls').innerText) + parseInt(document.getElementById('lenIssues').innerText)


    } else {
        document.getElementById('lenContrib').innerHTML = 0
        document.getElementById('lenPulls').innerHTML = 0
        document.getElementById('lenIssues').innerHTML = 0
        cityPageContributionsContainerPulls.innerHTML = '<p>Sem informações!</p>'
        cityPageContributionsContainerIssues.innerHTML = '<p>Sem informações!</p>'
    }


    toggleShowSection('cityPage')
}

function loadPageContributor(loginAuthor) {
    let authorData = qd.contributors[loginAuthor]
    document.getElementById('contributorPageAvatar').src = authorData.avatarUrl
    document.getElementById('contributorPageTitle').innerHTML = loginAuthor
    document.getElementById('contributorPageGithub').innerHTML = authorData.profileUrl
    document.getElementById('contributorPageGithub').href = authorData.profileUrl
    let cityPageTitle = ''

    if (Object.keys(authorData).includes('cities')) {

        let contributorPageContributionsContainerCities = document.getElementById('contributorPageContributionsContainerCities')
        document.getElementById('lenContribCities').innerHTML = authorData.cities.length
        contributorPageContributionsContainerCities.innerHTML = ''
        contributorPageContributionsContainerCities.style.height = `${(authorData.cities.length * 5) + 40}px`
        authorData.cities.forEach(id => {
            let spiderbase =  qd.cities[id].info.spiderbase ? qd.cities[id].info.spiderbase[0] : ''
            cityPageTitle = `${qd.cities[id].info.territory_name} (${qd.cities[id].info.state_code})`
            contributorPageContributionsContainerCities
                .insertAdjacentHTML('beforeend', `<li>
                <a href="#" onclick="loadPageCity(${id},'contributorPage')">${cityPageTitle}</a> 
                <span class="badge rounded-pill text-bg-warning">${spiderbase}</span>
                </li>`)
        })
    } else {
        document.getElementById('lenContribCities').innerHTML = 0
        contributorPageContributionsContainerCities.style.height = '30px'
        contributorPageContributionsContainerCities.innerHTML = '<p>Sem informações!</p>'
    }

    if (Object.keys(authorData).includes('commits')) {
        let gitCommits = {}
        Object.values(qd.cities)
            .filter(city => city.spider)
            .forEach(city => city.spider.commits.forEach(commit => Object.assign(gitCommits, { [commit.oid]: commit })))
        let contributorPageContributionsContainerCommits = document.getElementById('contributorPageContributionsContainerCommits')
        document.getElementById('lenContribCommits').innerHTML = authorData.commits.length
        contributorPageContributionsContainerCommits.innerHTML = ''
        authorData.commits.forEach(id => {
            let v = gitCommits[id]
            contributorPageContributionsContainerCommits
                .insertAdjacentHTML('beforeend', `<li class="p-2 mb-2 border border-secondary rounded">
                <a href="${v.url}" target="_blank" rel="noopener noreferrer">${v.messageHeadline}</a> (${v.oid.slice(0, 7)}) | 
                <img class="rounded-circle" src="${v.author.avatarUrl}&size=24" alt="">
                <span>${v.author.name}</span> | <span>${v.committedDate}</span>
            </li>`)
        })
    } else {
        document.getElementById('lenContribCommits').innerHTML = 0
        contributorPageContributionsContainerCommits.innerHTML = '<p>Sem informações!</p>'
    }

    if (Object.keys(authorData).includes('prs')) {
        let gitPRs = Object.fromEntries(qd.github.prs.nodes.map(pr => [pr.number, pr]))
        let contributorPageContributionsContainerPulls = document.getElementById('contributorPageContributionsContainerPulls')
        document.getElementById('lenContribPulls').innerHTML = authorData.prs.length
        contributorPageContributionsContainerPulls.innerHTML = ''
        authorData.prs.forEach(id => {
            let v = gitPRs[id]
            contributorPageContributionsContainerPulls
                .insertAdjacentHTML('beforeend', `<li class="p-2 mb-2 border border-secondary rounded">
                        <a href="${v.url}" target="_blank" rel="noopener noreferrer">${v.title}</a> (#${v.number}) | 
                        <img class="rounded-circle" src="${v.author.avatarUrl}&size=24" alt="">
                        <span>${v.author.login}</span> | <span>${v.createdAt}</span>
                    </li>`)
        })
    } else {
        document.getElementById('lenContribPulls').innerHTML = 0
        contributorPageContributionsContainerPulls.innerHTML = '<p>Sem informações!</p>'
    }
    if (Object.keys(authorData).includes('issues')) {
        let gitIssues = Object.fromEntries(qd.github.issues.nodes.map(issue => [issue.number, issue]))
        let contributorPageContributionsContainerIssues = document.getElementById('contributorPageContributionsContainerIssues')
        document.getElementById('lenContribIssues').innerHTML = authorData.issues.length
        contributorPageContributionsContainerIssues.innerHTML = ''
        authorData.issues.forEach(id => {
            let v = gitIssues[id]
            contributorPageContributionsContainerIssues
                .insertAdjacentHTML('beforeend', `<li class="p-2 mb-2 border border-secondary rounded">
                        <a href="${v.url}" target="_blank" rel="noopener noreferrer">${v.title}</a> (#${v.number}) | 
                        <img class="rounded-circle" src="${v.author.avatarUrl}&size=24" alt="">
                        <span>${v.author.login}</span> | <span>${v.createdAt}</span>
                    </li>`)
        })
    } else {
        document.getElementById('lenContribIssues').innerHTML = 0
        contributorPageContributionsContainerIssues.innerHTML = '<p>Sem informações!</p>'
    }

    toggleShowSection('contributorPage')
}



function checkSpiderBase() {
    Object.values(qd.cities)
        .forEach(city => {
            if (city.contributions && city.contributions.issues) {
                let idIssues = city.contributions.issues.map(issue => issue.number)
                let bases = Object.keys(qd.github.spiderbases)
                let hasBase = idIssues.some(id => bases.includes(String(id)))
                let issuesBase = idIssues.filter(id => bases.includes(String(id)))
                if (hasBase) {
                    let cityBases = issuesBase.map(i => qd.github.spiderbases[i])
                    console.log(city.info.territory_id, '=>', cityBases)
                    city.info.spiderbase = cityBases
                }
            }
        })
} //checkSpiderBase()
