import { useState, useEffect } from "react"
import { Redirect, useHistory, useParams } from "react-router-dom"
import AnimeDetails from "../components/AnimeDetails"
import EpisodePlayer from "../components/EpisodePlayer"
import WatchTopBar from "../components/WatchTopBar"
import tippy from 'tippy.js'
import RelatedContent from "../components/RelatedContent"
import WatchNavigation from "../components/WatchNavigation"
import Navigation from "../components/Navigation"

const ENDPOINT = "/api/latest"

const Watch = ({ fromEpisode }: { fromEpisode: string | null }) => {
    var history = useHistory()
    const { aId, eNum } = useParams<{ aId: string, eNum: string | undefined }>()
    const [episode, updateEpisode] = useState<Record<string, any>>({})
    const [animeTitle, updateTitle] = useState<string>("")
    const [episodeName, updateName] = useState<string>("")
    const [episodesList, updateList] = useState<Record<string, any>[]>([])
    const [relatedContent, updateRelated] = useState<Record<string, any>[]>([])
    const [sideMenu, updateSideMenu] = useState<boolean>(false)
    const [soon, updateSoon] = useState<boolean>(false)

    useEffect(() => {
        const script = document.createElement('script');
        script.innerHTML = "(function(s,u,z,p){s.src=u,s.setAttribute('data-zone',z),p.appendChild(s);})(document.createElement('script'),'https://iclickcdn.com/tag.min.js',4169282,document.body||document.documentElement)"
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        }
    }, []);
    
    useEffect(() => {
        window.scrollTo(0, 60)
    }, [aId, eNum])

    useEffect(() => {
        if (fromEpisode) {
            var params = {
                more_info: "Yes",
                anime_id: aId,
                episode_id: fromEpisode
            }
            fetch(encodeURI(`${ENDPOINT}?mode=episodes&json=${JSON.stringify(params)}`), {
                headers: new Headers({
                    "Client-Id": process.env.REACT_APP_CLIENT_ID,
                    "Client-Secret": process.env.REACT_APP_CLIENT_SECRET
                } as HeadersInit)
            })
            .then((response) => { return response.json() })
            .then((data) => {
                if (data) {
                    if (data["status"] && data["status"] == 404 ) {
                        history.push({ pathname: "/error/404" })
                        return
                    }
                    if (data["response"] && data["response"]["data"]) {
                        var response = data["response"]["data"]
                        var episode = response[0]
                        updateEpisode(episode)
                        history.replace({ pathname: "/" + aId + "/" + episode["episode_number"] })
                    }
                }
            })
        }
        const controller = new AbortController()
        const signal = controller.signal
        fetch(ENDPOINT + '?mode=episodes&json=%7B"more_info":"Yes","anime_id":' + aId + '%7D', {
            headers: new Headers({
                "Client-Id": process.env.REACT_APP_CLIENT_ID,
                "Client-Secret": process.env.REACT_APP_CLIENT_SECRET
            } as HeadersInit), signal: signal
        })
        .then((response) => { return response.json() })
        .then((data) => {
            if (data) {
                if (data["status"] && data["status"] == 404 ) {
                    history.push({ pathname: "/error/404" })
                    return
                }
                if (data["response"] && data["response"]["data"]) {
                    updateList(data["response"]["data"])
                }
            }
        })
        return () => {
            try { if (!controller.signal.aborted) controller.abort() } catch (error) { }
            updateTitle("")
            updateName("")
            updateRelated([])
            updateList([])
            updateSoon(false)
        }
    }, [aId])

    useEffect(() => {
        tippy("[data-tippy-content]")
    })

    return (
        <>
            { !eNum && !fromEpisode ? 
                <Redirect to={ `/${aId}/1` } />
                : 
                <div id="watch" className="menu-content">
                    <WatchNavigation />
                    <Navigation trigger="#hamburger-menu" secondary={ true } selected="none" shown={false} />
                    <div className="watch-page">
                        <WatchTopBar showEpisodeButton={episodesList.length > 1} episodeName={episodeName} animeTitle={animeTitle} />
                        <EpisodePlayer soon={soon} fromEpisode={fromEpisode ? true : false} episode={episode} episodesList={episodesList} setEpisodeName={(episodeName) => updateName(episodeName)} animeId={aId} episodeNumber={eNum ? eNum : episode["episode_number"]} />
                        <AnimeDetails setSoon={() => updateSoon(true)} episodesList={episodesList} setRelated={(related: Record<string, any>[]) => updateRelated(related)} setTitle={(animeTitle) => updateTitle(animeTitle)} animeId={aId} />
                        <RelatedContent related={relatedContent} />
                    </div>
                </div>
            }
        </>
    )
}

export default Watch