
const TractUIWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  width: 400px;
`

const DiameterUI = styled.div`
  background: white;
  border-radius: 50%;
  height: 5px;
  width: 5px;
  margin-top: ${props => (props.value * 100).toString() + 'px'};
`

function TractUI(p) {
  const [data, setData] = useState([])

  useEffect(()=>{
    p.voice.tract.port.onmessage = (e) => {
      setData(Array.from(e.data))
    }
  },[])

  return (
    <TractUIWrapper>
      {data.map((value, key) =>
        <DiameterUI key={key} value={value}/>
      )}
    </TractUIWrapper>
  )

}
