A canva-like editor where the state of the document is encoded into the URL, making this ideal for putting diagram images in README docs because if you ever need to alter a diagram, all you need to do is go to the link, make the changes, and replace the link.


Forked from [Excalidraw](https://github.com/excalidraw/excalidraw)

## Embeddable image URL

The app now includes a render endpoint for readonly payloads:

`/api/render?data=<readonlyPayload>&format=svg`

You can also pass a full readonly link:

`/api/render?url=<https://.../#data=...>&format=svg`

Use it in markdown image syntax:

![Diagram](https://docagram.vercel.app/api/render?data=eJx1U11vmzAUfe-vQPR1STGfIY_b-tBpmSYxaZqmaXLgAk4cmxqTlFX57712ErxkGkiWOPfr-JzL653n-XrswF96PryUlLNK0YP_zuB7UD2TAkOh_e7loEqb2Wrd9cuHB6hrKDXbw6zvaInn2GvYzTb5ZrNPVfecH8pks4lnURCQOe26ecN0O6znFexPI4DDDoTuselP_Pa8V3tihFVm0EqScPxRfIXiWxPWvz8Xn57VaEtt0oW5QhZUNBxc6AXxhCTzMMDZYRhkQUTCKTqaSyWL62gyhQ-s0q1JidIJa4E1rUaQZPE8xrokziOSxkHq2p44LL1gQnqt5BY-SC6VIXpPwLyO5pqW20bJQVRTjlZUoJwKdXF5NeO80KPtjkagTf7NjO8Xzjf4_6pwaNMK6I32ZEIl-si0kYcE7haGYfdUWZt-OU6K7uDJ-CQGzieYiQqM-j4NrqaJ6jzt4rEzMDojR8cdwDTOk3SRRmnirHFLSbJb8IsUdj9JEibxIk1TV8b6j7hr2jatKe_BOWCYPbo9vLrL0FX0VESyLCILkkf5InMScya2tzVclls3x6JHPK1uPv4EhcaWkwyoLasK9scg4VnxE6ahMzv8F7SSFTwKuua31_D3DA7v_12l-9o-ZxvOzFYD16xANfDPlcIaYvgd745vAgUQxA&format=svg)

Notes:
- `data` is the payload value from `#data=...` (omit the `#data=` prefix).
- You can provide either `data` or `url`.
- Current implementation supports `format=svg`.
- Payloads above the endpoint limit are rejected.

Install
```
yarn    (install )
yarn start    (run app)
```